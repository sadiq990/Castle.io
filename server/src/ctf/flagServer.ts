import type { CTFState, FlagState, GameWorldState, PlayerState, Team } from 'shared/types/entities.js';

export const FLAG_PICKUP_RADIUS = 75;
export const CASTLE_SCORE_RADIUS = 120;
export const WINNING_SCORE = 3;

export function createInitialCTF(): CTFState {
  return {
    flags: {
      blue: {
        team: 'blue',
        status: 'AT_HOME',
        position: { x: 500, y: 500 },
        carrierId: null,
        homePosition: { x: 500, y: 500 },
        dropTimer: 0,
      },
      red: {
        team: 'red',
        status: 'AT_HOME',
        position: { x: 2500, y: 2500 },
        carrierId: null,
        homePosition: { x: 2500, y: 2500 },
        dropTimer: 0,
      },
    },
    scores: { blue: 0, red: 0 },
    winner: null,
  };
}

export type NotificationCallback = (data: { text: string; color: string }) => void;

export function updateCTF(
  world: GameWorldState,
  dt: number,
  notify: NotificationCallback
): void {
  const ctf = world.ctf;
  if (ctf.winner) return; // Game ended, waiting for reset

  const teams: Team[] = ['blue', 'red'];

  for (const team of teams) {
    const flag = ctf.flags[team];

    // ── 1. CARRIED STATE ──────────────────────────────────────
    if (flag.status === 'CARRIED' && flag.carrierId) {
      const carrier = world.players[flag.carrierId];

      if (!carrier) {
        // Carrier disconnected -> drop flag immediately
        flag.status = 'DROPPED';
        flag.carrierId = null;
        flag.dropTimer = 30;
        notify({
          text: `⬇️ ${team === 'blue' ? 'Mavi' : 'Qırmızı'} bayraq yerə düşdü!`,
          color: team === 'blue' ? '#3B82F6' : '#EF4444',
        });
        continue;
      }

      // Sync flag position with carrier
      flag.position.x = carrier.position.x;
      flag.position.y = carrier.position.y;
      carrier.hasFlag = true;
      carrier.speedMultiplier = 0.85; // -15% speed debuff

      // Check if carrier brought enemy flag to their own castle (SCORE!)
      const homeCastle = world.castles.find(c => c.team === carrier.team);
      if (homeCastle) {
        const distToOwnCastle = Math.hypot(
          carrier.position.x - homeCastle.position.x,
          carrier.position.y - homeCastle.position.y
        );

        if (distToOwnCastle <= CASTLE_SCORE_RADIUS) {
          // Score!
          ctf.scores[carrier.team] += 1;
          flag.status = 'AT_HOME';
          flag.position = { ...flag.homePosition };
          flag.carrierId = null;
          carrier.hasFlag = false;
          carrier.speedMultiplier = 1.0;

          notify({
            text: `🏆 ${carrier.team === 'blue' ? 'Mavi' : 'Qırmızı'} komanda xal qazandı! (${ctf.scores.blue} - ${ctf.scores.red})`,
            color: carrier.team === 'blue' ? '#3B82F6' : '#EF4444',
          });

          // Check Win Condition
          if (ctf.scores[carrier.team] >= WINNING_SCORE) {
            ctf.winner = carrier.team;
            notify({
              text: `👑 ${carrier.team === 'blue' ? 'MAVİ' : 'QIRMIZI'} KOMANDA QALİB GƏLDİ!`,
              color: carrier.team === 'blue' ? '#60A5FA' : '#F87171',
            });

            // Reset match after 6 seconds
            setTimeout(() => {
              world.ctf = createInitialCTF();
              notify({
                text: '🔄 Yeni raund başladı! Bayraqlar evdədir.',
                color: '#10B981',
              });
            }, 6000);
          }
        }
      }
    }

    // ── 2. DROPPED STATE (30s timer) ──────────────────────────
    else if (flag.status === 'DROPPED') {
      flag.dropTimer -= dt;

      if (flag.dropTimer <= 0) {
        flag.status = 'AT_HOME';
        flag.position = { ...flag.homePosition };
        flag.dropTimer = 0;
        flag.carrierId = null;
        notify({
          text: `🏠 ${team === 'blue' ? 'Mavi' : 'Qırmızı'} bayraq qalaya qayıtdı!`,
          color: team === 'blue' ? '#3B82F6' : '#EF4444',
        });
      }
    }

    // ── 3. PROXIMITY PICKUP / RETURN ──────────────────────────
    if (flag.status === 'AT_HOME' || flag.status === 'DROPPED') {
      for (const player of Object.values(world.players)) {
        const dist = Math.hypot(
          player.position.x - flag.position.x,
          player.position.y - flag.position.y
        );

        if (dist <= FLAG_PICKUP_RADIUS) {
          // Teammate touches dropped flag -> Return to base immediately!
          if (player.team === flag.team && flag.status === 'DROPPED') {
            flag.status = 'AT_HOME';
            flag.position = { ...flag.homePosition };
            flag.dropTimer = 0;
            flag.carrierId = null;
            notify({
              text: `🛡️ ${team === 'blue' ? 'Mavi' : 'Qırmızı'} bayraq xilas edildi və qalaya qaytarıldı!`,
              color: team === 'blue' ? '#3B82F6' : '#EF4444',
            });
            break;
          }

          // Enemy touches flag (either AT_HOME or DROPPED) -> PICKUP!
          if (player.team !== flag.team && !player.hasFlag) {
            flag.status = 'CARRIED';
            flag.carrierId = player.id;
            flag.dropTimer = 0;
            player.hasFlag = true;
            player.speedMultiplier = 0.85;

            notify({
              text: `🚩 ${team === 'blue' ? 'Mavi' : 'Qırmızı'} bayraq ${player.name} tərəfindən oğurlandı!`,
              color: team === 'blue' ? '#3B82F6' : '#EF4444',
            });
            break;
          }
        }
      }
    }
  }
}

export function handlePlayerAttack(
  world: GameWorldState,
  attackerId: string,
  notify: NotificationCallback
): void {
  const attacker = world.players[attackerId];
  if (!attacker) return;

  const ATTACK_RANGE = 75;

  for (const player of Object.values(world.players)) {
    if (player.id === attacker.id || player.team === attacker.team) continue;

    const dist = Math.hypot(
      player.position.x - attacker.position.x,
      player.position.y - attacker.position.y
    );

    if (dist <= ATTACK_RANGE && player.hasFlag) {
      // Enemy carrying flag hit!
      const carriedFlag = Object.values(world.ctf.flags).find(f => f.carrierId === player.id);
      if (carriedFlag) {
        carriedFlag.status = 'DROPPED';
        carriedFlag.carrierId = null;
        carriedFlag.dropTimer = 30;
        player.hasFlag = false;
        player.speedMultiplier = 1.0;

        notify({
          text: `⚔️ ${player.name} vuruldu! Bayraq yerə düşdü!`,
          color: carriedFlag.team === 'blue' ? '#3B82F6' : '#EF4444',
        });
      }
    }
  }
}
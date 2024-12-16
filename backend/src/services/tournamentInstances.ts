import { Eq } from "fp-ts/lib/Eq";
import { PlayerData, Pairing } from "@shared/types/tournament";

export const eqPlayerData: Eq<PlayerData> = {
  equals: (a, b) => a.id === b.id && a.name === b.name,
};

export const eqPairing: Eq<Pairing> = {
  equals: (a, b) =>
    a.round === b.round &&
    ((eqPlayerData.equals(a.player1, b.player1) &&
      eqPlayerData.equals(a.player2, b.player2)) ||
      (eqPlayerData.equals(a.player1, b.player2) &&
        eqPlayerData.equals(a.player2, b.player1))),
};

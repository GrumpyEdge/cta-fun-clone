/* @flow */

import { RARITY } from "../web-app/src/shared/constants/constants.mjs"; // eslint-disable-line

/* ::

    export type RuneType = 
        | 'D' // damage
        | 'G' // guard (def)
        | 'A' // swift (aps)
        | 'V' // vitality (hp)
        | 'P' // precise (critRate)
        | 'K' // planx (knight knightShield)
        | 'R' // rage (ctkdmg)
        | 'E' // splash (aoe)
        | 'N' // nimble (dodgerate)
        | 'F' // frozen (freezeTime)
        | 'C' // chilling (freezeChance)
        | 'S' // dazed (stunTime)
        | 'X' // stunning (stunChance)
        | 'B' // burning (burnTime)
        | 'I' // ignite (burnChance)
        | 'Y' // poison chance
        | 'W' // poison time

    export type RunePrimariy =
        | 'D' // damage
        | 'A' // aps
        | 'R' // ctkdmg
        | 'E' // AoE
        | 'V' // hp
        | 'G' // def
        | 'W' // poison time
        | 'B' // burning (burnTime)
        | 'F' // frozen (freezeTime)
        

    export type RuneSecondary =
        | 'D' // damage
        | 'M' // moveSpeed
        | 'R' // ctkdmg
        | 'L' // AtkRange
        | 'V' // hp
        | 'G' // def
        | 'U' // ultimate
        | 'B' // Bad, meaning gold

    export type RunesStats = {|
        atk: number,
        def: number,
        aoe: number,
        aps: number,
        ctkrate: number,
        ctkdmg: number,
        hp: number,
        freezeTime: number,
        freezeChance: number,
        stunTime: number,
        stunChance: number,
        poisonTime: number,
        poisonChance: number,
        atkrange: number,
        mvspd: number,
        burnChance: number,
        burnTime: number,
        dodgerate: number,
        knightShield: number,
    |}

    export type RORunesStats = $ReadOnly<RunesStats>

    export type CLS = 'lancer' | 'ranger' | 'magician' | 'gunner' | 'support' | 'barbarian' | 'samurai' | 'rogue' | 'brawler' | 'knight'

    type RuneBuild = $ReadOnly<{|
        runes: [RuneType, RuneType, RuneType],
        runePrimaries: [RunePrimariy, RunePrimariy, RunePrimariy],
        runeSecondaries: [RuneSecondary, RuneSecondary, RuneSecondary, RuneSecondary],
    |}>
  export type HeroBaseRecord = $ReadOnly<{|
    name: HeroName,
    elementKind: 'water' | 'fire' | 'earth' | 'light' | 'dark',
    tribe: string,
    sex: 'f' | 'm',
    flying: bool,
    crusher: bool,
    rarity: $Keys<typeof RARITY>,
    class: CLS,
    atk: number,
    hp: number,
    def: number,
    ctkrate: number,
    ctkdmg: number,
    aps: number,
    atkrange: number,
    mvspd: number,
    effresistance: number,
    dodgerate?: number,
    sp1: string,
    sp2: string,
    sp4?: string,
    sp5?: string,
    runeBuilds: $ReadOnly<{
      default: RuneBuild,
      poor?: RuneBuild,
      tank?: RuneBuild,
      dps?: RuneBuild,
      cc?: RuneBuild // crowd controll
    }>,
    timedSp2Sec?: number
  |}>

    export type Hero = $ReadOnly<{|
        ...HeroBaseRecord,
        nameNoSpace: string,
        shortName: string,
        emoji: string,
        emojiId: string,
        tire: 'S' | 'A' | 'B' | 'C' | 'none',
        dodgerate: number,
        sp4: string,
        sp5: string,
    |}>

    export type HeroProgressI = $ReadOnly<{
        name: HeroName,
        ev: number,
        aw: number,
        weapon: number,
        averageRuneStars: number,
        averageRuneLvlProgress: number,
        ...RuneBuild
    }>
    export type HeroProgress = $ReadOnly<$Exact<HeroProgressI>>

    export type BattleTeamDefinition = {| type: 'basic', team: $ReadOnlyArray<HeroProgress>, buff: BuffMap |} | {| type: 'detailed', team: $ReadOnlyArray<OwnedHeroRecord>, buff: BuffMap, isX2: bool |}

    export type HeroInfoWithBattleProgress = $ReadOnly<{|
        type: 'basic',
        ...Hero,
        ...HeroProgress,
    |}>

    export type HeroInfoWithOwnedHeroRecord = $ReadOnly<{|
        type: 'detailed',
        ...Hero,
        ...OwnedHeroRecord,
    |}>

    export type Element = 'water' | 'fire' | 'earth' | 'light' | 'dark'
    export type HeroBattleStats = $ReadOnly<{|
        name: HeroName,
        class: CLS,
        ev: number,
        elementKind: Element,
        dodgerate: number,
        sp1: string,
        sp2: string,
        sp5: string,
        emoji: string,
        emojiId: string,
        flying: bool,
        id: string,
        initialHp: number,
        initialKnightShield: number,
        aoeMult: number,
        additionalStunChancePrc: number,
        stunTimeMutl: number,
        additionalFreezeChancePrc: number,
        freezeTimeMult: number,
        additionalBurnChancePrc: number,
        burnTimeMult: number,
        additionalPoisonChancePrc: number,
        poisonTimeMult: number,
        def: number,
        atk: number,
        aps: number,
        ctkrate: number,
        ctkdmg: number,
        atkrange: number,
        mvspd: number,
        aoeMult: number,
        additionalStunChancePrc: number,
        stunTimeMutl: number,
        additionalFreezeChancePrc: number,
        freezeTimeMult: number,
        additionalBurnChancePrc: number,
        burnTimeMult: number,
        additionalPoisonChancePrc: number,
        poisonTimeMult: number,
        timedSp2Sec?: number,
        weapon: number,
        runes: [RuneType, RuneType, RuneType]
    |}>

export type CommonHeroName = 
    "Bugonaut Archer" |
    "Bat" |
    "Blue Fish" |
    "Light Knight" |
    "Skeleton Giant" |
    "Vulcan Archer" |
    "Skeleton Infantry" |
    "Spike" |
    "Big Eye" |
    "Sprout" |
    "Swift" |
    "Vulcan Fighter" |
    "Bugonaut Spear" |
    "Dragon Bot" |
    "Voodoo Dagger" |
    "Skeleton Ranger" |
    "Bugonaut Fighter" |
    "Voodoo Archer" |
    "Bugonaut Giant" |
    "Tiny Dragon" |
    "Voodoo Spear" |
    "Vulcan Hammer" |
    "Healer Bot"

export type FcEpicHeroName = 
    "Leaf Blade" |
    "Hikari" |
    "Onyx" |
    "Green Faery" |
    "Petunia" |
    "Ice Cube" |
    "Alda" |
    "Scud" |
    "Tesla" |
    "Valkyrie" |
    "Torch" |
    "Kasumi" |
    "Thorn"

export type FcRareHeroName =  
    "Akwa" |
    "Dark Hunter" |
    "Gladiator" |
    "Tellus" |
    "Musashi" |
    "Robin Hood" |
    "Goddess" |
    "Black Beard" |
    "Luka" |
    "Mizu" |
    "Oceana" |
    "Fire Monk" |
    "Siegfried" |
    "Natura" |
    "Mecha Valken" |
    "Kasai" |
    "Pirato" |
    "Joan Of Arc" |
    "Krouki" |
    "Dark Knight" |
    "Krunk" |
    "Wolfie" |
    "Monki Mortar" |
    "Misty" |
    "Neko" |
    "Xak" |
    "Spyro" |
    "Dark Wolf" |
    "Gold Knight" |
    "Chaos" |
    "Jasmine" |
    "Arcana" |
    "Merlinus" |
    "Rufus" |
    "Magmus" |
    "Kage" |
    "Spark"

export type EventRareHeroName =
    | "Ice Knight"
    | "Snowman"
    | "Pumpking"
    | "Pinky"
    | "Bun Gun"
    | "Ser Shu"
    | "Ra"
    | "Circe"

export type EventEpicHeroName =
    | "Trickster"

export type EventHeroName =
    | EventEpicHeroName
    | EventRareHeroName

export type CrusherHeroName =
    | "Atlantus"
    | "Furiosa"
    | "Groovine"
    | "One Eye"
    | "Sorrow"

export type BlitzHeroName =
    | "Namida"
    | "Frost Queen"
    | "Hooky"
    | "Clawdette"
    | "Paladin"
    | "Necromancer"
    | "Vlad"

export type ArenaShopHeroName = 
    | "Monki King"

export type BlitzShopHeroName =
    | "Thor"

export type HeroName = 
   | CommonHeroName
   | FcRareHeroName
   | FcEpicHeroName
   | EventHeroName
   | CrusherHeroName
   | BlitzHeroName
   | ArenaShopHeroName
   | BlitzShopHeroName
   | "Monki Roboti"

    export type HeroStateForCharacter = {| medals: number, aw: number, ev: number, desiredEv: null | number, weapon: number |}
    type HerosStateForCharacter = {
        [HeroName]: HeroStateForCharacter
    }

    export type ROHerosStateForCharacter = $ReadOnly<{
        [string]: $ReadOnly<HeroStateForCharacter>
    }>

    export type RandomSeeds = {|
        blitzChest: number,
        fortuneChest: number,
        premiumChest: number,
        nextDayGoldenChests: number,
        nextDayWoodenChests: number,
        dungeons: number,
    |}
    type _CharacterState<Heros, RS> = {|
        name: string,
        day: number,
        spenderType: 'F' | 'S' | 'M' | 'L',
        usd: number,
        flooz: number,
        dailyPack1SubscriptionDays: number,
        dailyPack2SubscriptionDays: number,
        heros: Heros,

        // dungeons
        numberOfAdditionalDungeonTicketBuysNormalDay: 0,
        numberOfAdditionalDungeonTicketBuysX2Day: 0,
        dungeonsPriority1: Element,
        dungeonsPriority2: Element,
        dungeonsPriority3: Element,
        dungeonsPriority4: Element,
        dungeonsPriority5: Element,

        luckyToken: number,
        commonWeaponCat: number,

        // chests
        waterChests: number,
        fireChests: number,
        earthChests: number,
        runeChests: number,
        premiumChests: number,

        // startet packs
        boughtStarterPackWater: bool,
        boughtStarterPackFire: bool,
        boughtStarterPackEarth: bool,
        boughtStarterPackLight: bool,
        boughtStarterPackDark: bool,
        boughtStarterPackFlooz5usd: bool,
        boughtStarterPackFlooz10usd: bool,
        boughtStarterPackFlooz20usd: bool,
        boughtStarterPackFlooz50usd: bool,
        boughtStarterPackFlooz100usd: bool,

        randomSeeds: RS
    |}

    export type CharacterState = _CharacterState<HerosStateForCharacter, RandomSeeds>
    export type ROCharacterState = $ReadOnly<_CharacterState<ROHerosStateForCharacter, $ReadOnly<RandomSeeds>>>

    export type OwnedHeroRecord = {|
        name: HeroName,
        ev: number,
        aw: number,
        runesStats: RunesStats
    |}

    export type OwnedHeros = { [HeroName]: OwnedHeroRecord }

    export type Team = $ReadOnlyArray<HeroProgress>
    export type Teams = $ReadOnly<{ [string]: Team }>
    export type UserState = $ReadOnly<{|
        characters: $ReadOnly<{
            [name: string]: ROCharacterState
        }>,
        activeCharacterName: string,
        teams: Teams,
        buckets: Buckets,
        ownedHeros: OwnedHeros,
        ownedHerosNames: Array<HeroName>,
        guildName: string,
    |}>

    export type DM = $ReadOnly<{| send: string => Promise<void> |}>

    export type DiscordPlayerMessageHandlerPropsType<A = empty> = $ReadOnly<{|
        reply:  string => Promise<void>,
        replyDM:  string => Promise<void>,
        input: string,
        getUserState: () => UserState,
        getActiveCharacterState: () => ROCharacterState,
        getActiveCharacterStateMutableCopy: () => CharacterState, // you can pass this copy into random generators, it will not affect the actual game state
        addAction: (action: A) => Promise<void>,
        lock: () => void,
        unlock: () => void,
        userid: string,
        deleteUserState: () => void,
        msg: $ReadOnly<{|
            reply: (any) => Promise<void>
        |}>
    |}>

    export type DmMap = { [string]: DM }

    export type ReducerProps<A> = $ReadOnly<{|
        state: UserState,
        action: A,
        userid: string,
        sendMsgToWeb: null | MsgToWeb => void,
        sendMsgToDM: string => Promise<any>,
    |}>

    export type Module<A = empty> = {|
        handler: (DiscordPlayerMessageHandlerPropsType<A>) => Promise<any>,
        reducer: (ReducerProps<A>) => UserState
    |}

    type InitRecord = $ReadOnly<{|
        type: 'init',
        heros: $ReadOnlyArray<{| heroId: string, emojiId: string |}>
    |}>
    type SpawnedRecord = $ReadOnly<{| type: "spawned", heroId: string, spawnIndex: number, depth: number, isFlying: bool |}>
    type PushedRecord = $ReadOnly<{| type: "pushed_to", heroId: string, position: number |}>
    type HpChangedRecord = $ReadOnly<{|
        type: "hp-changed",
        isCrit: bool,
        isHeal: bool,
        heroId: string,
        targetHpUpdate: {|
            heroId: string,
            value: number,
            hp: number,
            hpPrc: number,
            knightShield: number,
            knightShieldPrc: number,
        |},
        isSp2: bool
    |}>

    type DeathRecord = $ReadOnly<{|
        type: 'death',
        heroId: string
    |}>

    type MoveRecord = $ReadOnly<{| type: 'move', heroId: string, newPosition: number |}>

    type EndRecord = $ReadOnly<{| type: 'end', won: bool |}>
    type MissRecord = $ReadOnly<{|
        type: "miss",
        heroId: string,
        targetHeroId: string
    |}>

    type effectCategory = 'burn' | 'poison' | 'heal' | 'stun' | 'freeze' | 'slowDown' | 'defDown' | 'atkDown' | 'possess'
    type EffectStarted = $ReadOnly<{|
        type: 'effect-start',
        category: effectCategory,
        heroId: string
    |}>
    type EffectStoped = $ReadOnly<{|
        type: 'effect-stop',
        category: effectCategory,
        heroId: string
    |}>

    export type BattleLogRecord = 
        | InitRecord
        | SpawnedRecord
        | PushedRecord
        | HpChangedRecord
        | DeathRecord
        | MoveRecord
        | EndRecord
        | MissRecord
        | EffectStarted
        | EffectStoped




    // BATTLE 

    export type BattleBuffs = $ReadOnly<{|
      male: number,
      female: number,
      water: number,
      fire: number,
      earth: number,
      light: number,
      dark: number,
      gunner: number,
      lancer: number,
      ranger: number,
      magician: number,
      gunner: number,
      support: number,
      barbarian: number,
      samurai: number,
      rogue: number,
      brawler: number,
      knight: number,
    |}>

    export type BattleResultStats = {|
      fromToMap: { 
        [teamPlusTargetHeroName: string]: {|
          [teamPlusTargetHeroName: string]: {|
            heal: number,
            plain: number,
            crit: number,
            absorbedByDef: number,
            burn: number,
            poison: number,
            stunSec: number,
            freezeSec: number,
          |}
        |} 
      },
      deathMap: {},
      totalTicks: number,
      won: bool,
      numberOfHerosLost: number,
      numberOfHerosKilled: number
    |}

    export type BattleLog = Array<Array<BattleLogRecord>>

    export type BattleResult = $ReadOnly<{|
        battleResultStats: $ReadOnly<BattleResultStats>,
        battleLog: BattleLog,
        rndSeed: number
    |}>
  
    type EffectOverTimeBase = {| casterHeroId: string, ticksLeft: number |}
    export type EffectOverTime = $ReadOnly<{|
        ...EffectOverTimeBase,
        type: 'dot',
        category: 'poison' | 'burn',
        amount: number,
    |}> | $ReadOnly<{|
        ...EffectOverTimeBase,
        type: 'healing',
        amount: number,
    |}> | $ReadOnly<{|
        ...EffectOverTimeBase,
        type: 'slowDown' | 'defDown' | 'atkDown',
        amount: number,
    |}>
  
    export type HeroBattleState = {|
      depth: number, // 0 - 9
      spawnIndex: number,
      spawnInTicks: number,
      hp: number,
      knightShield: number,
      position: number,
      ticksUntilNextSp1: number,
      ticksTillSp2: number,
      attacksTillNextSp2: number,
      stunTicks: number,
      freezeTicks: number,
      possessedTicks: number, // circe possess
      pushingBackTicks: number,
      effectsOverTime: $ReadOnlyArray<EffectOverTime>,
    |}

    export type HeroBattleStateRO = $ReadOnly<HeroBattleState>

    export type HerosBattleStateMap = $ReadOnly<{
        [teamPlusTargetHeroName: string]: HeroBattleStateRO
    }>

    export type BattleState = $ReadOnly<{|
      ticks: number,
      heros: HerosBattleStateMap,
    |}>

    export type HerosBattleStatsMap = $ReadOnly<{
        [string]: HeroBattleStats
    }>

    export type TargetSelectionMethod = 'weakest-enemy' | 'random-ally' | 'closest-enemy' | 'enemy-backline' | 'self' | 'random-within-2x-range' | 'ally-with-least-hp-prc' | 'wave4' | 'wave10'

    export type AttackProps = $ReadOnly<{|
        atkDmgMult: number,
        numberOfAttacks: number,
        stunChance: number,
        freezeChance: number,
        burnChance: number,
        poisonChance: number,
        stunTime: number,
        freezeTime: number,
        burnTime: number,
        poisonTime: number,
        healPrcOfOwnHealth: number,
        healOverSecTime: number,
        possessTime: number,
        vampiric: number,
        healRndAllyFromDmgDone: number,
        burnMult: number,
        poisonMult: number,
        pushDistance: number,
        targetSelectionMethod: TargetSelectionMethod,
        forceNoFlyer: bool,
        aoe: number,
        slowDown: number,
        slowDownTime: number,
        defDown: number,
        defDownTime: number,
        atkDown: number,
        atkDownTime: number,
    |}>

    export type GwTeamPosition = {|
        type: 'fort',
        buffType: WarBuffType,
        index: 0 | 1 | 2 | 3 | 4 | 5
    |} | {|
        type: 'castle',
        index: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29
    |}

    export type BattlePosition = GwTeamPosition | {| type: "own", enemyTeamName: string |}

    export type TeamSlot = {| teamName: string, team: Team, pointsRemaining: number |}
    type TeamSlotOrNull = TeamSlot | null
    type Fort = {| buffType: WarBuffType, teams: [TeamSlotOrNull, TeamSlotOrNull, TeamSlotOrNull, TeamSlotOrNull, TeamSlotOrNull, TeamSlotOrNull] |}
    type FortSlot = Fort | null

    export type Guild = {|
        password: string,
        creatorUserId: string,
        name: string,
        members: Array<{|
            name: string,
            userid: string,
        |}>,
        warInProgress: bool,
        forts: [FortSlot, FortSlot, FortSlot, FortSlot, FortSlot, FortSlot], 
        castle: [
            TeamSlotOrNull, TeamSlotOrNull, TeamSlotOrNull, TeamSlotOrNull, TeamSlotOrNull, TeamSlotOrNull, TeamSlotOrNull, TeamSlotOrNull, TeamSlotOrNull, TeamSlotOrNull,
            TeamSlotOrNull, TeamSlotOrNull, TeamSlotOrNull, TeamSlotOrNull, TeamSlotOrNull, TeamSlotOrNull, TeamSlotOrNull, TeamSlotOrNull, TeamSlotOrNull, TeamSlotOrNull,
            TeamSlotOrNull, TeamSlotOrNull, TeamSlotOrNull, TeamSlotOrNull, TeamSlotOrNull, TeamSlotOrNull, TeamSlotOrNull, TeamSlotOrNull, TeamSlotOrNull, TeamSlotOrNull
        ],
        ownCastleBuffs: BuffMap,
        enemyCastleBuffs: BuffMap,
    |} 

    export type MsgToWeb = 
        {| type: 'STATE_FOR_WEB_APP_CHANGED', ownedHeros: OwnedHeros, ownedHerosNames: Array<HeroName>, teams: Teams, buckets: Buckets |}
        | {| type: 'GUILD_STATE_CHANGED', guild: Guild |}

    export type WarBuffType = Element | CLS
    export type BuffMap = { [string]: 0 | 1 | 2 }

    export type Bucket = $ReadOnly<{|
        name: string,
        teams: $ReadOnlyArray<{
            team: $ReadOnlyArray<HeroName>
        }>
    |}>

    export type Buckets = $ReadOnly<{
        [bucketName: string]: Bucket
    }>
*/

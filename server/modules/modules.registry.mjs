/* @flow */
/* :: import type { DmMap, UserState, DiscordPlayerMessageHandlerPropsType, ReducerProps } from '../types' */

import { arenaModule } from './arenaModule.mjs'
import { pvpModule } from './pvpModule.mjs'
import { offersModule } from './offersModule.mjs'
import { infoModule } from './infoModule.mjs'
import { chestsModule } from './chestsModule.mjs'
import { blitzModule } from './blitzModule.mjs'
import { heroModule } from './heroModule.mjs'
import { serviceModule } from './serviceModule.mjs'
import { nextDayModule } from './nextDayModule.mjs'
import { userModule } from './userModule.mjs'
import { charactersModule } from './charactersModule.mjs'
import { guildModule } from './guildModule.mjs'

export const modulesList/* :Array<{| handler: (DiscordPlayerMessageHandlerPropsType<any>) => Promise<any>, reducer: ReducerProps<any> => UserState |}> */ = [
    arenaModule,
    pvpModule,
    offersModule,
    infoModule,
    chestsModule,
    blitzModule,
    heroModule,
    serviceModule,
    nextDayModule,
    userModule,
    charactersModule,
    guildModule
]
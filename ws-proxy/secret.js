/* @flow */

const hashCode = s => s.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0).toString(16)

module.exports = {
    makeServerSecret: (serverId/* :string */) => {
        return hashCode(`a;lskdjvasv${serverId}f9380aeiw`)
    },
    makeClientSecret: (serverId/* :string */, clientId/* :string */) => {
        return hashCode(`sadfsd${serverId}${clientId}13d`)
    },
    makeServerId: (discordSecret/* :string */) => {
        return hashCode(`${discordSecret}0jf03iew0`)
    }
}
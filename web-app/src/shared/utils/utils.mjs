/* @flow */

export const splitArrIntoChunks = (size /* :number */, arr/* : Array<any> */)/* : Array<Array<any>> */ => {
    const result = []
    var i,j,chunk = size;
    for (i=0,j=arr.length; i<j; i+=chunk) {
      result.push(arr.slice(i,i+chunk));
    }
    return result
}

export const getAmountFromUserInput = (input/* :string */) => {
  let amount = parseInt(input.split(' ')[1], 10)

  if (isNaN(amount)) {
    amount = 1
  }

  return Math.min(amount, 500)
}

export const boundaryInt = (min/* :number */, max/* :number */, value/* :number */) => {
  return Math.min(Math.max(value, min), max)
}

export const printNumber = (n/* :number */) => {
  if (n > 1000000) {
    return `${Math.round(n / 1000000 * 100) / 100}m`
  }
  if (n > 1000) {
    return `${Math.round(n / 1000 * 100) / 100}k`
  }
  return Math.round(n).toString()
}

export const printDecimal = (n/* :number */) => {
  const d = Math.round(n * 100) / 100
  const full = Math.floor(d)
  const decimalPart = (d - full).toString()
  return `${full}.${decimalPart[2] || 0}${decimalPart[3] || 0}`
}

export const discordEmojiAssetUrl = (emojiid/* :string */) => (
  `https://cdn.discordapp.com/emojis/${emojiid}.png`
);
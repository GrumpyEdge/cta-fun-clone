/* @flow */

export const spenderTypes = {
    'F' : {
      description:
        "Free to play. You will not be able to buy anything that cost real money.",
      initialBalance: 0,
      perMonth: 0,
    },
    'S': {
      description:
        "Small spender. 50usd initial budget. 25usd per month from second month.",
      initialBalance: 50,
      perMonth: 25,
    },
    'M': {
      description:
        "Medium spender. 500usd initial budget. 100usd per month from second month.",
      initialBalance: 500,
      perMonth: 100,
    },
    'L': {
      description:
        "Whale. 1000usd initial budget. 300usd per month from second month.",
      initialBalance: 1000,
      perMonth: 300,
    },
};
  
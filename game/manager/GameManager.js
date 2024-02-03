// const databaseManager = require("../../MongoDB/DatabaseManager");
const {
  ROWS,
  COLUMNS,
  SYMBOL_TEXTURE_COUNT,
  REEL_POSITIONS,
} = require("../config/config");
const UsersStorage = require("../usersStorage/UsersStorage");
const User = require("../user/User");
const MathUtils = require("../../game/utility/math/MathUtils");
const horizontalMatchCombinations = require("../horizontalMatches");
const JWT = require("../../JWT/JWTManager");

module.exports = class GameManager {
  static async userSpinAction(socketID, data) {
    let spinActionResultData = {};

    try {
      const { bet, authToken } = data;
      // const hashedPassword = JWT.decode(authToken);
      // const userDatabaseData = await databaseManager.findUser({
      //   passwordHash: hashedPassword,
      // });
      const user = this.getUser(socketID);
      const { credits } = user.data;

      if (this.checkIfThePlayerHasEnoughMoney(credits, bet)) {
        spinActionResultData.success = false;
      } else {
        const symbolTextureIndexes = this.getRandomSymbolsTextureIndexes();
        const horizontalMatches =
          this.checkHorizontalMatches(symbolTextureIndexes);
        const verticalMatches = this.checkVerticalMatches(symbolTextureIndexes);
        const totalCreditsWin = this.calculateTotalCreditsWin(
          horizontalMatches.symbolIndexes,
          bet
        );
        const creditsBalance = credits - bet + totalCreditsWin;
        user.credits = creditsBalance;
        //   await databaseManager.updatePlayer({
        //     accountID: decodedToken,
        //     money: totalMoney,
        //   });

        spinActionResultData = {
          symbolTextureIndexes,
          creditsBalance,
          horizontalMatches,
          verticalMatches,
          totalCreditsWin,
        };
      }

      // res.json(spinData);
    } catch (error) {
      console.error("An error occurred:", error);
      spinActionResultData.error = "Internal Server Error";
      // res.status(500).json({ error: "Internal Server Error" });
    }
    return spinActionResultData;
  }

  static getRandomSymbolsTextureIndexes() {
    const symbolsTextureIndexes = [];
    for (let i = 0; i < COLUMNS; i++) {
      symbolsTextureIndexes[i] = [];
      for (let j = 0; j < ROWS - 1; j++) {
        const randomSYmbolTextureIndex = MathUtils.getRandomNumberFloor(
          0,
          SYMBOL_TEXTURE_COUNT - 1
        );
        symbolsTextureIndexes[i][j] = randomSYmbolTextureIndex;
      }
    }
    return symbolsTextureIndexes;
  }

  static calculateTotalCreditsWin(matches, bet) {
    const matchesCount = matches.length;
    const winCredits = bet * matchesCount;
    return winCredits;
  }

  static calculateTotalWinMoney(currentMoney, bet, moneyWon) {
    return currentMoney - bet + moneyWon;
  }

  static checkIfThePlayerHasEnoughMoney(money, bet) {
    return money - bet < 0 || money < 0 || bet < 100 || bet > money;
  }

  static createNewUser(socketID) {
    const newUser = new User();
    UsersStorage.addUser(socketID, newUser);
  }

  static getUserState(socketID) {
    return UsersStorage.getUser(socketID).getData();
  }

  static getUser(socketID) {
    return UsersStorage.getUser(socketID);
  }

  static deleteUser(socketID) {
    UsersStorage.deleteUser(socketID);
  }

  static checkHorizontalMatches(textureIndexes) {
    const matches = {
      symbolIndexes: [],
      lineIndexes: [],
    };
    for (const combination of horizontalMatchCombinations) {
      const array = combination.symbolsCoordinates.map(
        ([row, column]) => textureIndexes[row][column]
      );

      const allAreEqual = array.every((num) => num === array[0]);
      if (
        allAreEqual ||
        array.includes(7) ||
        array.includes(10) ||
        array.includes(9)
      ) {
        const filteredArray = array.filter(
          (num) => num !== 7 && num !== 10 && num !== 9
        );
        const isEqual = filteredArray.every((num) => num === filteredArray[0]);
        if (allAreEqual || isEqual) {
          matches.symbolIndexes.push(combination.symbolsIndex);
          matches.lineIndexes.push(combination.lineIndex);
        }
      }
    }

    return matches;
  }

  static checkVerticalMatches(textureIndexes) {
    let reelPositionsX = [];

    for (let i = 0; i < COLUMNS; i++) {
      if (
        textureIndexes[i][0] === textureIndexes[i][1] &&
        textureIndexes[i][0] === textureIndexes[i][2]
      ) {
        let reelX = REEL_POSITIONS[i];
        reelPositionsX.push(reelX);
      }
    }
    return reelPositionsX;
  }
};

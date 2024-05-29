// const databaseManager = require("../../MongoDB/DatabaseManager");
const {
  ROWS,
  COLUMNS,
  SYMBOL_TEXTURE_COUNT,
  REEL_POSITIONS,
  BET_STEPS,
  SYMBOLS_MULTIPLIER,
} = require("../config/config");
const UsersStorage = require("../usersStorage/UsersStorage");
const User = require("../user/User");
const MathUtils = require("../../game/utility/math/MathUtils");
const horizontalMatchCombinations = require("../horizontalMatches");
const symbolTypes = require("../symbolTypes");
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
      const playerBetValue = parseFloat(bet);

      if (this.checkIfThePlayerHasEnoughMoney(credits, playerBetValue)) {
        spinActionResultData.success = false;
      } else {
        const symbolTextureIndexes = this.getRandomSymbolsTextureIndexes();
        const { horizontalMatches, symbolsIndexes } =
          this.checkHorizontalPayLines(symbolTextureIndexes);
        const verticalMatches = this.checkVerticalMatches(symbolTextureIndexes);

        const matchLineCredits = this.calculatePayLineCredits(
          symbolsIndexes,
          horizontalMatches.symbolIndexes,
          playerBetValue
        );

        const totalCreditsWin = this.calculateTotalCreditsWin(matchLineCredits);
        const creditsBalance = credits - playerBetValue + totalCreditsWin;
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
          matchLineCredits,
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
          i === 0 ? SYMBOL_TEXTURE_COUNT - 2 : SYMBOL_TEXTURE_COUNT - 1
        );
        symbolsTextureIndexes[i][j] = randomSYmbolTextureIndex;
      }
    }
    return symbolsTextureIndexes;
  }

  static calculatePayLineCredits(symbolsIndexes, payLines, playerBetValue) {
    const credits = [];
    if (payLines.length === 0) return credits;
    for (let i = 0; i <= payLines.length - 1; i++) {
      const symbolIndex = symbolsIndexes[i];
      const payLine = payLines[i];
      const symbolData = this.findSymbolDataByIndex(symbolIndex);

      const numberOfSymbols = payLine.filter(
        (element) => element !== false
      ).length;
      let winBets = null;

      if (numberOfSymbols === SYMBOLS_MULTIPLIER[0]) {
        const multiplier = symbolData.multiplier["3x"];
        winBets = this.calculateWinnings(playerBetValue, multiplier);
      } else if (numberOfSymbols === SYMBOLS_MULTIPLIER[1]) {
        const multiplier = symbolData.multiplier["4x"];
        winBets = this.calculateWinnings(playerBetValue, multiplier);
      } else if (numberOfSymbols === SYMBOLS_MULTIPLIER[2]) {
        const multiplier = symbolData.multiplier["5x"];
        winBets = this.calculateWinnings(playerBetValue, multiplier);
      }

      credits.push(winBets);
    }

    return credits;
  }

  static calculateTotalCreditsWin(matchLineCredits) {
    return matchLineCredits.reduce((sum, current) => sum + current, 0);
  }

  static calculateTotalWinMoney(currentMoney, bet, moneyWon) {
    return currentMoney - bet + moneyWon;
  }

  static checkIfThePlayerHasEnoughMoney(money, bet) {
    return money - bet < 0;
  }

  static createNewUser(socketID) {
    const newUser = new User();
    UsersStorage.addUser(socketID, newUser);
  }

  static getUserState(socketID) {
    const playerCredits = UsersStorage.getUser(socketID).getData().credits;
    return {
      credits: playerCredits,
      betSteps: BET_STEPS,
    };
  }

  static getUser(socketID) {
    return UsersStorage.getUser(socketID);
  }

  static deleteUser(socketID) {
    UsersStorage.deleteUser(socketID);
  }

  static checkHorizontalPayLines(textureIndexes) {
    const horizontalMatches = {
      symbolIndexes: [],
      lineIndexes: [],
    };
    const symbolsIndexes = [];
    const payLines = [];
    for (const combination of horizontalMatchCombinations) {
      const drawnSymbolsIndexes = combination.symbolsCoordinates.map(
        ([row, column]) => textureIndexes[row][column]
      );

      const [isPayLine, fitElementsIndexes, symbolIndex] =
        this.handlePayLine(drawnSymbolsIndexes);

      if (isPayLine) {
        const combinationSymbolsIndex = combination.symbolsIndex.map(
          (value, index) => {
            return fitElementsIndexes[index] ? value : false;
          }
        );

        console.log(fitElementsIndexes);
        if (
          fitElementsIndexes[0] === false ||
          this.checkThePayPLineAlreadyExist(combinationSymbolsIndex, payLines)
        )
          break;

        symbolsIndexes.push(symbolIndex);
        payLines.push(combinationSymbolsIndex);
        horizontalMatches.symbolIndexes.push(combinationSymbolsIndex);
        horizontalMatches.lineIndexes.push(combination.lineIndex);
      }
    }

    return { horizontalMatches, symbolsIndexes };
  }

  static handlePayLine(drawnSymbolsIndexes) {
    let [isPayLine, fitElementsIndexes, symbolIndex] = this.checkPayLine(
      drawnSymbolsIndexes,
      5
    );
    if (isPayLine) {
      return [isPayLine, fitElementsIndexes, symbolIndex];
    }

    [isPayLine, fitElementsIndexes, symbolIndex] = this.checkPayLine(
      drawnSymbolsIndexes,
      4
    );
    if (isPayLine) {
      return [isPayLine, fitElementsIndexes, symbolIndex];
    }

    [isPayLine, fitElementsIndexes, symbolIndex] = this.checkPayLine(
      drawnSymbolsIndexes,
      3
    );
    if (isPayLine) {
      return [isPayLine, fitElementsIndexes, symbolIndex];
    }

    return [false];
  }

  static checkPayLine(drawnSymbolsIndexes, symbolsCount) {
    let symbolIndex = null;
    let consecutiveCount = 1;
    let fitElementsIndexes = [];
    for (let i = 0; i < drawnSymbolsIndexes.length - 1; i++) {
      if (
        drawnSymbolsIndexes[0] === drawnSymbolsIndexes[i + 1] ||
        drawnSymbolsIndexes[i + 1] === symbolTypes["bell"].index
      ) {
        consecutiveCount++;
        fitElementsIndexes.push(true);
        if (consecutiveCount === symbolsCount) {
          fitElementsIndexes.push(true);
          symbolIndex = drawnSymbolsIndexes[0];
          return [true, fitElementsIndexes, symbolIndex];
        }
      } else {
        return [false, (fitElementsIndexes = []), symbolIndex];
      }
    }
  }

  static checkThePayPLineAlreadyExist(actualPayLine, existingPayLines) {
    const stringArray1 = JSON.stringify(actualPayLine);
    for (let subArray of existingPayLines) {
      if (JSON.stringify(subArray) === stringArray1) {
        return true;
      }
    }
    return false;
  }

  static findSymbolDataByIndex(index) {
    for (const key in symbolTypes) {
      if (symbolTypes.hasOwnProperty(key)) {
        if (symbolTypes[key].index === index) {
          return symbolTypes[key];
        }
      }
    }
    return null;
  }

  static calculateWinnings(playerBetValue, multiplier) {
    let newBetValue = null;
    if (multiplier.startsWith("*")) {
      const multiplierValue = parseFloat(multiplier.substring(1));
      newBetValue = playerBetValue * multiplierValue;
    } else if (multiplier.startsWith("/")) {
      const multiplierValue = parseFloat(multiplier.substring(1));
      newBetValue = playerBetValue / multiplierValue;
    }

    return newBetValue;
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

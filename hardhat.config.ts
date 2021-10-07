import { task } from "hardhat/config";
import { HardhatUserConfig } from "hardhat/types";
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber } from "ethers";
import dotenv from 'dotenv'
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "hardhat-deploy";

dotenv.config()

// When using the hardhat network, you may choose to fork Fuji or Avalanche Mainnet
// This will allow you to debug contracts using the hardhat network while keeping the current network state
// To enable forking, turn one of these booleans on, and then run your tasks/scripts using ``--network hardhat``
// For more information go to the hardhat guide
// https://hardhat.org/hardhat-network/
// https://hardhat.org/guides/mainnet-forking.html
const FORK_FUJI = false;
const FORK_MAINNET = false;
const forkingData = FORK_FUJI
  ? {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
    }
  : FORK_MAINNET
  ? {
      url: "https://api.avax.network/ext/bc/C/rpc",
      // blockNumber: 5177320 // 5 joe to wavax pangolin to traderjoe (projected profit 1929583186261342 wavax)
      // blockNumber: 5249335 // 5 usdt to wavax sushi to pangolin (projected profit 808954986702980 wavax)
      // blockNumber: 5249426 // 5 usdt to wavax sushi to pangolin (projected profit 989513321016076 wavax)
      // blockNumber: 5249523 // 5 usdt to wavax sushi to panglin (projected profit 975636811072329 wavax)
      // blockNumber: 5249586 // 10 usdt to wavax sushi to pangolin (project profit 470658700559315 wavax)
      // blockNumber: 5249692 // 10 usdt to wavax sushi to pangolin (project profit 1135402592789238 wavax)
      // blockNumber: 5251297 // 10 joe to wavax traderjoe to pangolin (projected profit 243778322177914 wavax)
      // blockNumber: 5251439 // 10 joe to wavax traderjoe to pangolin (projected profit 1190372056744608 wavax)
      // blockNumber: 5251468 // 1 wavax to joe pangolin to traderjoe (projected profit 75516005670000000 wavax aka 0.07551600566917815)
      // blockNumber: 5251556 // 50 joe to wavax traderjoe to pangolin (projected profit 3403556492944739 wavax)
      // blockNumber: 5251618 // 75 joe to wavax traderjoe to pangolin (projected profit 24475828070000000 wavax aka 0.024475828065500242)
      // blockNumber: 5251870 // 75 joe to wavax traderjoe to pangolin (projected profit 15500747114593090 wavax aka 0.01550074711459309)
      // blockNumber: 5251864 // 1 wavax to joe pangolin to traderjoe (projected profit 177607747793017341 wavax aka 0.17760774779301733) // Gas used 206229 // Gas price 1200000000000 // Gas fee 53661198258
      // blockNumber: 5252617 // 1 wavax to joe pangolin to traderjoe (projected profit 162499252421836495 wavax aka 0.1624992524218365) // Gas used 206229 // Gas price 1200000000000 // Gas fee 53661198258
      // blockNumber: 5252814 // 1 wavax to joe traderjoe to pangolin (projected profit 239483049727551773 wavax aka 0.239483049727551773)
      // blockNumber: 5306013 // 1 wavax to joe traderjoe to pangolin (projected profit 50809123602056431 wavax aka 0.050809123602056431)
      // blockNumber: 5016623
    }
  : undefined;

task(
  "accounts",
  "Prints the list of accounts",
  async (args, hre): Promise<void> => {
    const accounts: SignerWithAddress[] = await hre.ethers.getSigners();
    accounts.forEach((account: SignerWithAddress): void => {
      console.log(account.address);
    });
  }
);

task(
  "balances",
  "Prints the list of AVAX account balances",
  async (args, hre): Promise<void> => {
    const accounts: SignerWithAddress[] = await hre.ethers.getSigners();
    for (const account of accounts) {
      const balance: BigNumber = await hre.ethers.provider.getBalance(
        account.address
      );
      console.log(`${account.address} has balance ${balance.toString()}`);
    }
  }
);

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.5.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1337,
          },
        }
      },
      {
        version: "0.6.2",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1337,
          },
        }
      },
      {
        version: "0.6.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1337,
          },
        }
      },
      {
        version: "0.6.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1337,
          },
        }
      },
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1337,
          },
        }
      },
      {
        version: "0.7.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1337,
          },
        }
      },
      {
        version: "0.8.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1337,
          },
        }
      },
    ],
  },
  networks: {
    hardhat: {
      // gasPrice: 225000000000,
      gasPrice: 'auto',
      chainId: !forkingData ? 43112 : 43114, // Only specify a chainId if we are not forking
      forking: forkingData
    },
    local: {
      url: 'http://localhost:9650/ext/bc/C/rpc',
      gasPrice: 225000000000,
      chainId: 43112,
      accounts: [
        "0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027",
        "0x7b4198529994b0dc604278c99d153cfd069d594753d471171a1d102a10438e07",
        "0x15614556be13730e9e8d6eacc1603143e7b96987429df8726384c2ec4502ef6e",
        "0x31b571bf6894a248831ff937bb49f7754509fe93bbd2517c9c73c4144c0e97dc",
        "0x6934bef917e01692b789da754a0eae31a8536eb465e7bff752ea291dad88c675",
        "0xe700bdbdbc279b808b1ec45f8c2370e4616d3a02c336e68d85d4668e08f53cff",
        "0xbbc2865b76ba28016bc2255c7504d000e046ae01934b04c694592a6276988630",
        "0xcdbfd34f687ced8c6968854f8a99ae47712c4f4183b78dcc4a903d1bfe8cbf60",
        "0x86f78c5416151fe3546dece84fda4b4b1e36089f2dbc48496faf3a950f16157c",
        "0x750839e9dbbd2a0910efe40f50b2f3b2f2f59f5580bb4b83bd8c1201cf9a010a",
      ],
    },
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      gasPrice: 225000000000,
      chainId: 43113,
      accounts: [`0x${process.env.METAMASK_PRIVATE_KEY}`],
    },
    mainnet: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      // gasPrice: 225000000000,
      gasPrice: 'auto',
      chainId: 43114,
      accounts: [`0x${process.env.METAMASK_PRIVATE_KEY}`],
    },
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
      hardhat: 0, // similarly on hardhat it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
      fuji: 0,
      mainnet: 0,
    },
    user: { // Used for testing
      default: 1, 
      hardhat: 1,
    },
    sushiSwapFactory: {
      default: '0x99653EfFF54a26bc24567A251F74d8A0A9905390',
      hardhat: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
      fuji: '0x99653EfFF54a26bc24567A251F74d8A0A9905390',
      mainnet: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4'
    },
    sushiSwapRouter: {
      default: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
      hardhat: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
      fuji: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
      mainnet: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'
    },
    pangolinFactory: {
      default: '0x5898f69bA879346AB91d1582F5450335Dd94DaCd',
      hardhat: '0xefa94DE7a4656D787667C749f7E1223D71E9FD88',
      fuji: '0x5898f69bA879346AB91d1582F5450335Dd94DaCd',
      mainnet: '0xefa94DE7a4656D787667C749f7E1223D71E9FD88'
    },
    pangolinRouter: {
      default: '0x456eb2F55555bF72a728bF971846686253910547',
      hardhat: '0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106',
      fuji: '0x456eb2F55555bF72a728bF971846686253910547',
      mainnet: '0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106'
    },
    traderJoeFactory: {
      default: '0x6b516B23A260E2d904Dbfa47c7e7AFd04E5ADBC9',
      hardhat: '0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10',
      fuji: '0x6b516B23A260E2d904Dbfa47c7e7AFd04E5ADBC9',
      mainnet: '0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10'
    },
    traderJoeRouter: {
      default: '0x4C7Edcc43424f474C2b37680565c1163f94c66FC',
      hardhat: '0x60aE616a2155Ee3d9A68541Ba4544862310933d4',
      fuji: '0x4C7Edcc43424f474C2b37680565c1163f94c66FC',
      mainnet: '0x60aE616a2155Ee3d9A68541Ba4544862310933d4'
    },
    wavax: {
      default: '0xd00ae08403B9bbb9124bB305C09058E32C39A48c',
      hardhat: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
      fuji: '0xd00ae08403B9bbb9124bB305C09058E32C39A48c',
      mainnet: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7'
    },
    usdt: {
      default: '0x320f9A00BDDFE466887A8D0390cF32e9373fFc9f',
      hardhat: '0xc7198437980c041c805A1EDcbA50c1Ce5db95118',
      fuji: '0x320f9A00BDDFE466887A8D0390cF32e9373fFc9f',
      mainnet: '0xc7198437980c041c805A1EDcbA50c1Ce5db95118'
    },
    usdc: {
      default: '0x684ebfda880c16652F7F571223c11029b96d0e10',
      hardhat: '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664',
      fuji: '0x684ebfda880c16652F7F571223c11029b96d0e10',
      mainnet: '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664'
    },
    dai: {
      default: '0x2125829808Fb3466d2114590b704f0266421951D',
      hardhat: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70',
      fuji: '0x2125829808Fb3466d2114590b704f0266421951D',
      mainnet: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70'
    },
    joeToken: {
      default: '0x2E4828F1a2dFC54d15Ef398ee4d0BE26d7211d56',
      hardhat: '0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd',
      fuji: '0x2E4828F1a2dFC54d15Ef398ee4d0BE26d7211d56',
      mainnet: '0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd'
    },
    png: {
      default: '0x6d0A79756774c7cbac6Ce5c5e3b0f40b0ccCcB20',
      hardhat: '0x60781C2586D68229fde47564546784ab3fACA982',
      fuji: '0x6d0A79756774c7cbac6Ce5c5e3b0f40b0ccCcB20',
      mainnet: '0x60781C2586D68229fde47564546784ab3fACA982'
    },
    FlashSwapPangolinSushi: {
      fuji: '0x9a8Fc5F22615b870196964495A23BA874bDa0CAC',
      mainnet: '0xf66D30CEb072ea114EeD5444534E0f445e31763B'
    },
    FlashSwapSushiPango: {
      fuji: '0x3F57Fba60C2D4Cf51e5220193390c0802e0440ee',
      mainnet: '0x81347bD22546025E37E385739AB189f44D3bA013'
    },
    PangolinComputeLiquidityValue: {
      fuji: '0x1998eA0830C7A8961d235Fe1F48e02B73Ffbe335',
      mainnet: '0xE08998b1C3dE1f9Bca9DcFcE945E4bB4DEfD6A7d'
    },
    SushiswapV2ComputeLiquidityValue: {
      fuji: '0xe0c855673912B805620545d0372D36861B8FC87B',
      mainnet: '0x6f1B2B1eae80b5C03f27E961162B664789895B85'
    },
    TraderJoeComputeLiquidityValue: {
      fuji: '0xc32608bBb75c20f09ab5e794F64283A7E4C00e59',
      mainnet: '0x2Ae1F94eFaC53e0394251E59D46436350dB64C15'
    },
    FlashSwapPangoJoe: {
      fuji: '0x4493288630f293cF5aFd94F325b85978f7ADE1Cb',
      mainnet: '0xC433434C62f413Ec69f392AeC74Fa74a3551782F'
    },
    FlashSwapJoePango: {
      fuji: '0x75AE8752151746079B66B6B9A7ED1dbe20F156A5',
      mainnet: '0x6a247370CE1D82af104987cB22046eC554b95cD3'
    }
  },
  external: {
    contracts: [
      {
        artifacts: "node_modules/@openzeppelin/contracts-upgradeable/build/contracts",
      },
      {
        artifacts: "node_modules/@pangolindex/exchange-contracts/artifacts",
      },
      {
        artifacts: "node_modules/@traderjoe-xyz/core/artifacts",
      },
      {
        artifacts: "node_modules/@sushiswap/core/build/abi"
      }
    ],
    deployments: {
    //   example: ["node_modules/@cartesi/arbitration/build/contracts"],
    //   default: ["node_modules/@uniswap/v2-periphery/build"],
    //   hardhat: ['node_modules/@uniswap/v2-periphery/build', 'node_modules/@uniswap/v2-core/build'],
    //   fuji: ['node_modules/@uniswap/v2-periphery/build'],
    //   mainnet: ['node_modules/@uniswap/v2-periphery/builds']
    }
}
  // paths: {
  //   deploy: "deploy",
  //   deployments: "artifacts",
  // },
};

export default config;

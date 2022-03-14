# exactly_finance_challenge
Sr Solidity Developer Challenge

## Installation
```console
$ yarn install
```

## Usage

### Build
```console
$ yarn compile
```

### Test
```console
$ yarn test
```

### Deploying contracts

#### ETH Testnet
* Environment variables
    - Create a `.env` file with its values:
```
INFURA_API_KEY=[YOUR_INFURA_API_KEY_HERE]
DEPLOYER_PRIVATE_KEY=[YOUR_DEPLOYER_PRIVATE_KEY_without_0x]
REPORT_GAS=<true_or_false>
```

* Deploy the ETHPool contract
```shell
yarn hardhat deploy:ETHPool --network <NETWORK_NAME>
```


#### Etherscan verification
* Environment variables
```
ETHERSCAN_API_KEY=[YOUR_ETHERSCAN_API_KEY_HERE]
```

* Verify the ETHPool contract
```shell
yarn hardhat verify --network <NETWORK_NAME> DEPLOYED_CONTRACT_ADDRESS
```

#### Get the total ETH amount of the pool
```shell
yarn hardhat query:GetTotalETH --network <NETWORK_NAME> --pooladdr DEPLOYED_CONTRACT_ADDRESS
```

## Unit Test
* "ETHPool Unit Test"
    1. Ownership
        - [ ] "1.1 Pool owner should be deployer"
        - [ ] "1.2 Succeeds when owner transfers ownership"
        - [ ] "1.3 Fails when non-owner transfers ownership"
    2. ETHPool
        - [ ] "2.1 Anyone can deposit ETH to the pool"
        - [ ] "2.2 Only the team can deposit rewards"
        - [ ] "3.3 User can withdraw ETH from the pool at any time"
        - [ ] "3.4 Get user`s claimable amount"
        - [ ] "3.5 Users should be able to withdraw their deposits along with their share of rewards"
        - [ ] "3.6 Users should receive rewards considering the time when they deposited"
        - [ ] "3.7 Users should receive rewards considering the time when they deposited in several weeks"
        - [ ] "3.8 When user withdraw some amount while staking in several weeks"
        - [ ] "3.9 Check ETH amount held on the pool"
        - [ ] "3.10 Check ETH amount after several withdrawing and depositing"

## Deployed on Rinkeby Testnet

[0x7eF7c9566b9902680804d0Bc72f9c8eb82C80A1c](https://rinkeby.etherscan.io/address/0x7eF7c9566b9902680804d0Bc72f9c8eb82C80A1c)


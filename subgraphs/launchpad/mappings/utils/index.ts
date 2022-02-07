/* eslint-disable prefer-const */
import { BigInt, BigDecimal, Address } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/SaleFactory/ERC20";
import { ERC20NameBytes } from "../../generated/SaleFactory/ERC20NameBytes";
import { ERC20SymbolBytes } from "../../generated/SaleFactory/ERC20SymbolBytes";
import { SaleFactory as FactoryContract } from "../../generated/SaleFactory/SaleFactory";
import { Sale as SaleContract, Sale__getConfigurationResultParamsStruct } from "../../generated/SaleFactory/Sale";
import { Sale, Token } from "../../generated/schema"

export let ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
export let FACTORY_ADDRESS = "0xa6a6d0cc66e34606f0edfb5e00ca7c5c87be76bd";
export let ZERO_BI = BigInt.fromI32(0);
export let ONE_BI = BigInt.fromI32(1);
export let ZERO_BD = BigDecimal.fromString("0");
export let ONE_BD = BigDecimal.fromString("1");
export let BI_18 = BigInt.fromI32(18);

export let factoryContract = FactoryContract.bind(Address.fromString(FACTORY_ADDRESS));

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString("1");
  for (let i = ZERO_BI; i.lt(decimals as BigInt); i = i.plus(ONE_BI)) {
    bd = bd.times(BigDecimal.fromString("10"));
  }
  return bd;
}

export function convertTokenToDecimal(tokenAmount: BigInt, exchangeDecimals: BigInt): BigDecimal {
  if (exchangeDecimals == ZERO_BI) {
    return tokenAmount.toBigDecimal();
  }
  return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals));
}

export function isNullBnbValue(value: string): boolean {
  return value == "0x0000000000000000000000000000000000000000000000000000000000000001";
}

export function fetchTokenSymbol(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress);
  let contractSymbolBytes = ERC20SymbolBytes.bind(tokenAddress);

  let symbolValue = "unknown";
  let symbolResult = contract.try_symbol();
  if (symbolResult.reverted) {
    let symbolResultBytes = contractSymbolBytes.try_symbol();
    if (!symbolResultBytes.reverted) {
      if (!isNullBnbValue(symbolResultBytes.value.toHex())) {
        symbolValue = symbolResultBytes.value.toString();
      }
    }
  } else {
    symbolValue = symbolResult.value;
  }
  return symbolValue;
}

export function fetchTokenName(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress);
  let contractNameBytes = ERC20NameBytes.bind(tokenAddress);

  let nameValue = "unknown";
  let nameResult = contract.try_name();
  if (nameResult.reverted) {
    let nameResultBytes = contractNameBytes.try_name();
    if (!nameResultBytes.reverted) {
      if (!isNullBnbValue(nameResultBytes.value.toHex())) {
        nameValue = nameResultBytes.value.toString();
      }
    }
  } else {
    nameValue = nameResult.value;
  }
  return nameValue;
}

export function fetchTokenDecimals(tokenAddress: Address): BigInt {
  let contract = ERC20.bind(tokenAddress);
  let decimalValue = null;
  let decimalResult = contract.try_decimals();
  if (!decimalResult.reverted) {
    decimalValue = decimalResult.value;
  }
  return BigInt.fromI32(decimalValue as i32);
}

export function retreiveSale(saleAddress: Address, owner: Address) : Sale | null {

  let sale = Sale.load(saleAddress.toHex())
  if (sale === null) {
    return getSale(saleAddress, owner)
  }
  return sale;
}

export function getSale(saleAddress: Address, owner: Address) : Sale | null {
  
  let saleContract = SaleContract.bind(saleAddress);
  let configResult = saleContract.try_getConfiguration();
  if (configResult.reverted) {
    return null
  }
  let factoryResult = saleContract.try_factory();
  if (factoryResult.reverted) {
    return null
  }

  if (!factoryResult.value.equals(Address.fromString(FACTORY_ADDRESS))) {
    return null;
  }

  const saleConfig = configResult.value;

  let sale = new Sale(saleAddress.toHex());
  sale.owner = owner;
  sale.useEth = saleConfig.token.toHex() == ADDRESS_ZERO;

  const tokenAddress = saleConfig.token;
  let token = Token.load(tokenAddress.toHex());
  if (token === null) {
    token = new Token(tokenAddress.toHex());
    token.name = fetchTokenName(tokenAddress);
    token.symbol = fetchTokenSymbol(tokenAddress);
    let decimals = fetchTokenDecimals(tokenAddress);
    if (decimals === null) {
      return null;
    }
    token.save();
  }

  sale.token = token.id;
  if (!sale.useEth) {
    const baseTokenAddress = saleConfig.baseToken
    let baseToken = Token.load(baseTokenAddress.toHex());
    if (token === null) {
      baseToken = new Token(baseTokenAddress.toHex());
      baseToken.name = fetchTokenName(baseTokenAddress);
      baseToken.symbol = fetchTokenSymbol(baseTokenAddress);
      let decimals = fetchTokenDecimals(baseTokenAddress);
      if (decimals === null) {
        return null;
      }
      baseToken.save();
    }
    sale.baseToken = baseToken.id;
  }

  sale.canceled = false;
  sale.finalized = false;
  sale.deposited = false;

  sale.openingTime = saleConfig.startTime;
  sale.closingTime = saleConfig.endTime;
  sale.unlockTime = saleConfig.unlockTime;

  sale.rate = saleConfig.saleRate;
  sale.rateDecimals = saleConfig.saleRateDecimals;

  sale.listingRate = saleConfig.listingRate;
  sale.listingRateDecimals = saleConfig.listingRateDecimals;
  sale.liquidityPercent = saleConfig.liquidityPercent;

  sale.softCap = saleConfig.softCap;
  sale.hardCap = saleConfig.hardCap;

  sale.minContribution = saleConfig.minContribution;
  sale.maxContribution = saleConfig.maxContribution;

  sale.weiRaised = ZERO_BI;

  sale.save()
  return sale;
}

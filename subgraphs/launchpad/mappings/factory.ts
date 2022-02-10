/* eslint-disable prefer-const */
import { Sale, Token } from "../generated/schema";
import { NewSaleCreated, NewSaleMigrated } from "../generated/SaleFactory/SaleFactory";
import { Sale as SaleContract } from "../generated/SaleFactory/Sale";
import { Sale as SaleTemplate } from "../generated/templates";
import {
  FACTORY_ADDRESS,
  ZERO_BD,
  ZERO_BI,
  ONE_BI,
  fetchTokenSymbol,
  fetchTokenName,
  fetchTokenDecimals,
  ADDRESS_ZERO,
  FACTORY_ADDRESS_OLD,
} from "./utils";
import { Address } from "@graphprotocol/graph-ts";

export function handleSaleCreated(event: NewSaleCreated): void {
  
  let saleContract = SaleContract.bind(event.params.deployed);
  let configResult = saleContract.try_getConfiguration();
  if (configResult.reverted) {
    return;
  }
  let factoryResult = saleContract.try_factory();
  if (factoryResult.reverted) {
    return;
  }

  if (!factoryResult.value.equals(Address.fromString(FACTORY_ADDRESS))) {
    return;
  }

  let saleConfig = configResult.value;

  let sale = new Sale(event.params.deployed.toHex());
  sale.owner = event.params.from;
  sale.useEth = saleConfig.baseToken.toHex() == ADDRESS_ZERO;

  let tokenAddress = saleConfig.token;
  let token = Token.load(tokenAddress.toHex());
  if (token === null) {
    token = new Token(tokenAddress.toHex());
    token.name = fetchTokenName(tokenAddress);
    token.symbol = fetchTokenSymbol(tokenAddress);
    let decimals = fetchTokenDecimals(tokenAddress);
    if (decimals === null) {
      return;
    }
    token.decimals = decimals;
    token.save();
  }

  sale.token = token.id;
  if (!sale.useEth) {
    let baseTokenAddress = saleConfig.baseToken
    let baseToken = Token.load(baseTokenAddress.toHex());
    if (baseToken === null) {
      baseToken = new Token(baseTokenAddress.toHex());
      baseToken.name = fetchTokenName(baseTokenAddress);
      baseToken.symbol = fetchTokenSymbol(baseTokenAddress);
      let decimals = fetchTokenDecimals(baseTokenAddress);
      if (decimals === null) {
        return;
      }
      baseToken.decimals = decimals;
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
  sale.whitelistEnabled = saleConfig.whitelistEnabled;

  sale.save()

  SaleTemplate.create(event.params.deployed);
}


export function handleSaleMigrated(event: NewSaleMigrated): void {
  
  let saleContract = SaleContract.bind(event.params.deployed);
  let configResult = saleContract.try_getConfiguration();
  if (configResult.reverted) {
    return;
  }
  let factoryResult = saleContract.try_factory();
  if (factoryResult.reverted) {
    return;
  }

  if (!factoryResult.value.equals(Address.fromString(FACTORY_ADDRESS)) &&
  !factoryResult.value.equals(Address.fromString(FACTORY_ADDRESS_OLD))) {
    return;
  }

  let saleConfig = configResult.value;

  let sale = new Sale(event.params.deployed.toHex());
  sale.owner = event.params.from;
  sale.useEth = saleConfig.baseToken.toHex() == ADDRESS_ZERO;

  let tokenAddress = saleConfig.token;
  let token = Token.load(tokenAddress.toHex());
  if (token === null) {
    token = new Token(tokenAddress.toHex());
    token.name = fetchTokenName(tokenAddress);
    token.symbol = fetchTokenSymbol(tokenAddress);
    let decimals = fetchTokenDecimals(tokenAddress);
    if (decimals === null) {
      return;
    }
    token.decimals = decimals;
    token.save();
  }

  sale.token = token.id;
  if (!sale.useEth) {
    let baseTokenAddress = saleConfig.baseToken
    let baseToken = Token.load(baseTokenAddress.toHex());
    if (baseToken === null) {
      baseToken = new Token(baseTokenAddress.toHex());
      baseToken.name = fetchTokenName(baseTokenAddress);
      baseToken.symbol = fetchTokenSymbol(baseTokenAddress);
      let decimals = fetchTokenDecimals(baseTokenAddress);
      if (decimals === null) {
        return;
      }
      baseToken.decimals = decimals;
      baseToken.save();
    }
    sale.baseToken = baseToken.id;
  }

  let finalizedResult = saleContract.try_finalized();
  if (!finalizedResult.reverted) {
    sale.finalized = finalizedResult.value;
  } else {
    sale.finalized = false;
  }

  let canceledResult = saleContract.try_canceled();
  if (!canceledResult.reverted) {
    sale.canceled = canceledResult.value;
  } else {
    sale.canceled = false;
  }

  let depositedResult = saleContract.try_deposited();
  if (!depositedResult.reverted) {
    sale.deposited = depositedResult.value;
  } else {
    sale.deposited = false;
  }

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
  sale.whitelistEnabled = saleConfig.whitelistEnabled;

  let weiRaizedResult = saleContract.try_weiRaised();
  if (!weiRaizedResult.reverted) {
    sale.weiRaised = weiRaizedResult.value;
  } else {
    sale.weiRaised = ZERO_BI;
  }

  sale.save()

  SaleTemplate.create(event.params.deployed);
}

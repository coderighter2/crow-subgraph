/* eslint-disable prefer-const */
import { Sale, Token } from "../generated/schema";
import { NewSaleCreated } from "../generated/SaleFactory/SaleFactory";
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

  sale.save()

  SaleTemplate.create(event.params.deployed);
}

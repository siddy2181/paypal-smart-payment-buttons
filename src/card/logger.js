/* @flow */

import { getPageRenderTime } from "@krakenjs/belter/src";
import { FPTI_KEY, ENV, COUNTRY } from "@paypal/sdk-constants/src";
import { ZalgoPromise } from "@krakenjs/zalgo-promise/src";

import type { LocaleType } from "../types";
import { getLogger, setupLogger } from "../lib";
import { FPTI_CONTEXT_TYPE } from "../constants";

import { FPTI_HCF_KEYS } from "./constants";

type CardLoggerOptions = {|
  env: $Values<typeof ENV>,
  sessionID: string,
  clientID: string,
  partnerAttributionID: ?string,
  sdkCorrelationID: string,
  cardCorrelationID: string,
  locale: LocaleType,
  cardSessionID: string,
  merchantID: $ReadOnlyArray<string>,
  merchantDomain: string,
  sdkVersion: string,
  buyerCountry: $Values<typeof COUNTRY>,
|};

export function setupCardLogger({
  env,
  sessionID,
  cardSessionID,
  clientID,
  partnerAttributionID,
  sdkCorrelationID,
  cardCorrelationID,
  locale,
  merchantID,
  merchantDomain,
  sdkVersion,
  buyerCountry,
}: CardLoggerOptions): ZalgoPromise<void> {
  const logger = getLogger();

  setupLogger({
    env,
    sessionID,
    clientID,
    sdkCorrelationID,
    locale,
    sdkVersion,
    buyerCountry,
  });

  logger.addTrackingBuilder(() => ({
    [FPTI_KEY.CONTEXT_TYPE]: FPTI_CONTEXT_TYPE.BUTTON_SESSION_ID,
    [FPTI_KEY.CONTEXT_ID]: cardSessionID,
    [FPTI_KEY.BUTTON_VERSION]: __SMART_BUTTONS__.__MINOR_VERSION__,
    [FPTI_HCF_KEYS.HCF_SESSION_ID]: cardSessionID,
    [FPTI_HCF_KEYS.HCF_CORRELATION_ID]: cardCorrelationID,
    [FPTI_KEY.PARTNER_ATTRIBUTION_ID]: partnerAttributionID,
    [FPTI_KEY.SELLER_ID]: merchantID[0],
    [FPTI_KEY.MERCHANT_DOMAIN]: merchantDomain,
    [FPTI_KEY.TIMESTAMP]: Date.now().toString(),
  }));

  return ZalgoPromise.hash({
    pageRenderTime: getPageRenderTime(),
  }).then(({ pageRenderTime }) => {
    logger.track({
      [FPTI_KEY.PAGE_LOAD_TIME]: pageRenderTime
        ? pageRenderTime.toString()
        : "",
    });

    logger.flush();
  });
}

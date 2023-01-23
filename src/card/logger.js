/* @flow */

import { getPageRenderTime } from "@krakenjs/belter/src";
import { FPTI_KEY, ENV, COUNTRY } from "@paypal/sdk-constants/src";
import { ZalgoPromise } from "@krakenjs/zalgo-promise/src";

import { getLogger, setupLogger } from "../lib";
import { FPTI_CONTEXT_TYPE, FPTI_STATE } from "../constants";

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
  buyerCountry,
  type
}: CardLoggerOptions): ZalgoPromise<void> {
  const logger = getLogger();

  setupLogger({
    env,
    sessionID,
    clientID,
    sdkCorrelationID,
    locale,
    buyerCountry,
  });

  logger.addTrackingBuilder(() => ({
    [FPTI_KEY.CONTEXT_TYPE]: FPTI_CONTEXT_TYPE.BUTTON_SESSION_ID,
    [FPTI_KEY.CONTEXT_ID]: cardSessionID,
    [FPTI_KEY.BUTTON_VERSION]: __SMART_BUTTONS__.__MINOR_VERSION__,
    [FPTI_HCF_KEYS.HCF_SESSION_ID]: cardSessionID,
    [FPTI_HCF_KEYS.HCF_CORRELATION_ID]: cardCorrelationID,
    [FPTI_KEY.PARTNER_ATTRIBUTION_ID]: partnerAttributionID,
    [FPTI_KEY.MERCHANT_DOMAIN]: merchantDomain,
    [FPTI_KEY.TIMESTAMP]: Date.now().toString(),
  }));

  const tracking = {
    [FPTI_KEY.STATE]:                           FPTI_STATE.CARD,
    [FPTI_KEY.TRANSITION]:                      `card_${type}_field_rendered`,
    [FPTI_KEY.EVENT_NAME]:                      `card_${type}_field_rendered`,
  }

  return ZalgoPromise.hash({
    pageRenderTime: getPageRenderTime(),
  }).then(({ pageRenderTime }) => {
    logger.track({
      ...tracking,
      [FPTI_KEY.PAGE_LOAD_TIME]: pageRenderTime
        ? pageRenderTime.toString()
        : "",
    });

    logger.flush();
  });
}

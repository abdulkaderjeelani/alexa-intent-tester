/* tslint:disable:no-console */
/* tslint:disable:no-bitwise */
/* tslint:disable:prefer-template */

import * as Alexa from 'ask-sdk';
import { Response } from 'ask-sdk-model';
import proxyquire from 'proxyquire';

const createTestInput = (
  intentName: string,
  isNewSession = true,
  sessionAttributes: any,
  deviceId: string,
  sessionCallback: (session: any) => void = (session) => console.log(session),
  handlerInput: Alexa.HandlerInput | undefined = undefined
) => {
  const handlerIp =
    handlerInput ||
    (JSON.parse(
      `
  {
	"requestEnvelope": {
		"version": "1.0",
		"session": {
			"new ": ${isNewSession}
		},
		"context": {
			"System": {
				"device": {
					"deviceId": "${deviceId}"
				}
			}
		},
		"request": {
			"type": "IntentRequest",
			"requestId": "${uuid()}",
			"locale": "en-US",
			"intent": {
				"name": "${intentName}",
				"confirmationStatus": "NONE"
			},
			"dialogState": "STARTED"
		}
	},
	"attributesManager": {},
	"responseBuilder": {}
}
  `
    ) as Alexa.HandlerInput);
  let responseSpeech = '';
  let responseRePrompt = '';
  handlerIp.attributesManager.getSessionAttributes = () => sessionAttributes;
  handlerIp.attributesManager.setSessionAttributes = sessionCallback;
  handlerIp.responseBuilder.speak = (speech: string) => {
    console.info(`Speech: ${speech}`);
    responseSpeech = speech;
    return handlerIp.responseBuilder;
  };
  handlerIp.responseBuilder.withShouldEndSession = (b) => {
    console.info(`End Session: ${b}`);
    return handlerIp.responseBuilder;
  };

  handlerIp.responseBuilder.getResponse = () => ({
    outputSpeech: { type: 'SSML', ssml: responseSpeech },
    reprompt: { outputSpeech: { type: 'SSML', ssml: responseRePrompt } },
  });
  handlerIp.responseBuilder.reprompt = (prompt: string) => {
    console.info(`Prompt: ${prompt}`);
    responseRePrompt = prompt;
    return handlerIp.responseBuilder;
  };
  return handlerIp;
};

export type TestResponse = Response & { session: any };

export const invokeIntent = (
  handlerName: string,
  intentName: string,
  stubs: any = {},
  isNewSession = true,
  sessionAttributes: any = {},
  deviceId = 'test-device',
  index = '../../index'
): Promise<TestResponse> => {
  let session: any;
  const sessionCallback = (s: any) => (session = s);
  return (proxyquire(index, stubs)[handlerName].handle(
    createTestInput(intentName, isNewSession, sessionAttributes, deviceId, sessionCallback)
  ) as Promise<Response>).then((res) => ({ ...res, session }));
};

const uuid = () => {
  const self: any = {};
  const lut: any[] = [];
  for (let i = 0; i < 256; i++) {
    lut[i] = (i < 16 ? '0' : '') + i.toString(16);
  }
  self.generate = () => {
    const d0 = (Math.random() * 0xffffffff) | 0;
    const d1 = (Math.random() * 0xffffffff) | 0;
    const d2 = (Math.random() * 0xffffffff) | 0;
    const d3 = (Math.random() * 0xffffffff) | 0;
    return (
      lut[d0 & 0xff] +
      lut[(d0 >> 8) & 0xff] +
      lut[(d0 >> 16) & 0xff] +
      lut[(d0 >> 24) & 0xff] +
      '-' +
      lut[d1 & 0xff] +
      lut[(d1 >> 8) & 0xff] +
      '-' +
      lut[((d1 >> 16) & 0x0f) | 0x40] +
      lut[(d1 >> 24) & 0xff] +
      '-' +
      lut[(d2 & 0x3f) | 0x80] +
      lut[(d2 >> 8) & 0xff] +
      '-' +
      lut[(d2 >> 16) & 0xff] +
      lut[(d2 >> 24) & 0xff] +
      lut[d3 & 0xff] +
      lut[(d3 >> 8) & 0xff] +
      lut[(d3 >> 16) & 0xff] +
      lut[(d3 >> 24) & 0xff]
    );
  };
  return self;
};

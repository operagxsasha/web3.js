/* eslint-disable jest/no-disabled-tests */
/* eslint-disable jest/no-done-callback */
import {
	EthExecutionAPI,
	JsonRpcId,
	Web3APIPayload,
	DeferredPromise,
	JsonRpcResponse,
} from 'web3-common';
import WebSocketProvider from '../../src/index';
import { Web3WSProviderError } from '../../src/errors';
import { accounts } from '../fixtures/config';
import { WSRequestItem } from '../../src/types';

describe('WebSocketProvider - implemented methods', () => {
	let webSocketProvider: WebSocketProvider;
	let jsonRpcPayload: Web3APIPayload<EthExecutionAPI, 'eth_getBalance'>;

	beforeEach(() => {
		jsonRpcPayload = {
			jsonrpc: '2.0',
			id: 42,
			method: 'eth_getBalance',
			params: [accounts[0].address, 'latest'],
		} as Web3APIPayload<EthExecutionAPI, 'eth_getBalance'>;
		webSocketProvider = new WebSocketProvider('ws://localhost:8545');
	});

	describe('websocker provider tests', () => {
		let currentAttempt = 0;
		const waitForOpenConnection = async (provider: WebSocketProvider) => {
			return new Promise<void>((resolve, reject) => {
				const maxNumberOfAttempts = 10;
				const intervalTime = 5000; // ms

				const interval = setInterval(() => {
					if (currentAttempt > maxNumberOfAttempts - 1) {
						clearInterval(interval);
						reject(new Error('Maximum number of attempts exceeded'));
					} else if (provider.getStatus() === 'connected') {
						clearInterval(interval);
						resolve();
					}
					// eslint-disable-next-line no-plusplus
					currentAttempt++;
				}, intervalTime);
			});
		};
		it.skip('should connect', async () => {
			await waitForOpenConnection(webSocketProvider);
			expect(webSocketProvider).toBeInstanceOf(WebSocketProvider);
			expect(webSocketProvider.getStatus()).toBe('connected');
		});
	});

	describe('subscribe event tests', () => {
		it.skip('should subscribe on message', done => {
			webSocketProvider.on('message', (err, res) => {
				if (err) {
					done.fail(err);
				}
				expect(res?.id).toBe(jsonRpcPayload.id);
				done();
			});
			webSocketProvider.request(jsonRpcPayload).catch(err => {
				done.fail(err);
			});
		});

		it.skip('should subscribe on error', done => {
			const errorMsg = 'Custom WebSocket error occured';
			webSocketProvider.on('error', err => {
				expect(err?.message).toBe(errorMsg);
				done();
			});
			// Manually emit an error event - accessing private emitter
			webSocketProvider['_wsEventEmitter'].emit('error', new Web3WSProviderError(errorMsg));
		});
		// it.skip('should subscribe on close', done => {
		// 	webSocketProvider.on('close', (err, res) => {
		// 		console.warn(err);
		// 		console.warn(res);
		// 		done();
		// 	});
		// 	console.warn(webSocketProvider.getStatus());
		// 	webSocketProvider.disconnect(1000, 'close');
		// });
	});
	describe('disconnect and reset test', () => {
		// it.skip('should disconnect', async () => {});
		it('should reset', async () => {
			jsonRpcPayload = {
				jsonrpc: '2.0',
				id: 42,
				method: 'eth_getBalance',
				params: [accounts[0].address, 'latest'],
			} as Web3APIPayload<EthExecutionAPI, 'eth_getBalance'>;
			const defPromise = new DeferredPromise<JsonRpcResponse<ResponseType>>();

			const reqItem: WSRequestItem<any, any, any> = {
				payload: jsonRpcPayload,
				deferredPromise: defPromise,
			};

			webSocketProvider['_requestQueue'].set(jsonRpcPayload.id as JsonRpcId, reqItem);
			expect(webSocketProvider['_requestQueue'].size).toBe(1);

			webSocketProvider['_sentQueue'].set(jsonRpcPayload.id as JsonRpcId, reqItem);
			expect(webSocketProvider['_sentQueue'].size).toBe(1);

			webSocketProvider.reset();
			expect(webSocketProvider['_requestQueue'].size).toBe(0);
			expect(webSocketProvider['_sentQueue'].size).toBe(0);
		});
	});
});
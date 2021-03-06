import * as actions from './actions';
import * as attributeSelectors from './selectors';
import { appSelectors } from '../app';
import { push } from 'react-router-redux';
import { globalContext as ctx } from '../../context';
import { walletsSelectors, walletsOperations } from '../wallets';

const loadAttributes = () => async (dispatch, getState) => {
	const config = appSelectors.getAppConfig(getState());
	const wallet = walletsSelectors.getSelected(getState());
	if (!wallet) return;
	try {
		await dispatch(actions.setAttributesLoading(true));
		let attributes = await ctx.lwsService.getAttributes(wallet.publicKey, config.attributes);
		await dispatch(actions.updateAttributes(attributes.payload.attributes));
	} catch (error) {
		await dispatch(actions.updateAttributes(error.payload, true));
		if (!error.payload) {
			console.error('unknown error', error);
			return;
		}
	} finally {
		await dispatch(actions.setAttributesLoading(false));
	}
};

const clearAttributes = () => async (dispatch, getState) => {
	await dispatch(actions.setAttributesLoading(true));
	const config = appSelectors.getAppConfig(getState());
	try {
		const wallet = walletsSelectors.getSelected(getState());
		if (wallet) {
			await dispatch(walletsOperations.selectWallet(null));
		}
		await dispatch(actions.updateAttributes(null));
		await dispatch(push(`${config.hash}/wallets`));
	} finally {
		await dispatch(push(`${config.hash}/wallets`));
		await dispatch(actions.setAttributesLoading(false));
	}
};

const authWithAttrs = () => async (dispatch, getState) => {
	const config = appSelectors.getAppConfig(getState());
	const wallet = walletsSelectors.getSelected(getState());
	const attributes = attributeSelectors.getOnlyAllowed(getState());

	try {
		await dispatch(actions.setAttributesLoading(true));
		await ctx.lwsService.sendSignup(config, wallet.publicKey, attributes);
		let authResp = await ctx.lwsService.sendAuth(config, wallet.publicKey);
		await ctx.lwsService.sendWPAuth(authResp.payload, authResp.error);
		await dispatch(push(`${config.hash}/auth/success`));
	} catch (error) {
		console.log('auth error', error);
		await ctx.lwsService.sendWPAuth(error.payload || {}, true);
		await dispatch(walletsOperations.selectWallet(null));
		await dispatch(actions.updateAttributes(null));
		await dispatch(push(`${config.hash}/auth/failed`));
	} finally {
		await dispatch(actions.setAttributesLoading(false));
	}
};

export default { ...actions, loadAttributes, clearAttributes, authWithAttrs };

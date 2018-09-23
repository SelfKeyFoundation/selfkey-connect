import * as actions from './actions';
import { globalContext as ctx } from '../../context';
import { push } from 'react-router-redux';

const initApp = hash => async (dispatch, getState) => {
	try {
		await dispatch(actions.setAppLoading(true));
		await dispatch(actions.setAppConfig({ hash }));
		let config = await ctx.lwsService.connect(hash);
		await dispatch(actions.setAppConfig({ ...config, hash }));
		let wss = await ctx.lwsService.checkWSS(hash);
		if (wss.error) {
			// eslint-disable-next-line no-throw-literal
			throw { error: true, payload: { code: 'no_wss', message: 'No WSS' } };
			return dispatch(push(`${config.hash}/error/no-wss`));
		}
		await dispatch(actions.setAppError(null));
		await dispatch(push(`${hash}/wallets`));
	} catch (error) {
		console.error(error);
		await dispatch(actions.setAppError(error));
	} finally {
		await dispatch(actions.setAppLoading(false));
	}
};

const destroyApp = () => async (dispatch, getState) => {
	await ctx.lwsService.disconnect();
	await dispatch(actions.setAppConfig());
};

export default { ...actions, initApp, destroyApp };

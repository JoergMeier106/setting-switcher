import * as vscode from 'vscode';

const SETTINGS_CONFIG_NAME = 'switchSettings';
const CURRENT_SETTING_KEY = 'extension.switchSettings.currentSetting';
const SWITCH_SETTING_ID = 'extension.switchSettings.switchSetting';
const CURRENT_OBJECT_KEY = 'current';

let statusBarItem: vscode.StatusBarItem;

function storedSettingKeyIsValid(settingKey: string | undefined) : boolean {
	const settingKeys = Object.keys(vscode.workspace.getConfiguration(SETTINGS_CONFIG_NAME).settings);
	return settingKey !== undefined && settingKeys.includes(settingKey);
}

function getCurrentSetting(state: vscode.Memento) : string | undefined {
	let currentSetting = state.get<string>(CURRENT_SETTING_KEY)!;
	const settingKeys = Object.keys(vscode.workspace.getConfiguration(SETTINGS_CONFIG_NAME).settings);

	if (!storedSettingKeyIsValid(currentSetting)) {
		if (settingKeys.length > 0) {
			currentSetting = settingKeys[0];
			state.update(CURRENT_SETTING_KEY, currentSetting);
		} else {
			return undefined;
		}
	}
	return currentSetting;
}

async function updateCurrentSetting (currentSetting: string | undefined) {		
	if (currentSetting !== undefined) {
		let settings = vscode.workspace.getConfiguration(SETTINGS_CONFIG_NAME);
		let currentSettingObject = settings.settings[currentSetting];
		await settings.update(CURRENT_OBJECT_KEY, currentSettingObject, vscode.ConfigurationTarget.Workspace);

		statusBarItem.text = currentSetting;
	}
}

async function switchSetting(context: vscode.ExtensionContext) {
	const settings = Object.keys(vscode.workspace.getConfiguration(SETTINGS_CONFIG_NAME).settings);
	const currentSetting = await vscode.window.showQuickPick(settings);
	if (currentSetting === undefined){
		return;
	}
	context.workspaceState.update(CURRENT_SETTING_KEY, currentSetting);
	updateCurrentSetting(currentSetting);
}

export function activate(context: vscode.ExtensionContext) {

	let switchSettingDisposable = vscode.commands.registerCommand(SWITCH_SETTING_ID, 
		function () { switchSetting(context); });

	context.subscriptions.push(switchSettingDisposable);

	const currentSetting =  getCurrentSetting(context.workspaceState);

	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 800);
	statusBarItem.command = SWITCH_SETTING_ID;
	statusBarItem.show();
	context.subscriptions.push(statusBarItem);

	updateCurrentSetting(currentSetting);
}

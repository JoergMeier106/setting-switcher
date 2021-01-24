import * as vscode from 'vscode';

const SETTINGS_CONFIG_NAME = 'switchSettings';
const CURRENT_SETTING_KEY = 'extension.switchSettings.currentSetting';
const SWITCH_SETTING_ID = 'extension.switchSettings.switchSetting';
const SWITCHER_GROUPS_ID = 'extension.switchSettings.switcherGroups';
const CURRENT_OBJECT_KEY = 'current';
const DEFAULT_SWITCHER_ID = 0;

let statusBarItems: vscode.StatusBarItem[] = new Array<vscode.StatusBarItem>(0);

function storedSettingKeyIsValid(settingKey: string | undefined, settingKeys : string[]) : boolean {
	return settingKey !== undefined && settingKeys.includes(settingKey);
}

function getCurrentSetting(state: vscode.Memento, switcherID: number) : string | undefined {
	let currentSetting = state.get<string>(CURRENT_SETTING_KEY + switcherID)!;
	let settingKeys: string[] = [];
	if (switcherID === DEFAULT_SWITCHER_ID) {
		settingKeys = Object.keys(vscode.workspace.getConfiguration(SETTINGS_CONFIG_NAME).settings);
	} else {
		settingKeys = Object.keys(vscode.workspace.getConfiguration(SETTINGS_CONFIG_NAME).switcherGroups[switcherID - 1]);
	}

	if (!storedSettingKeyIsValid(currentSetting, settingKeys)) {
		if (settingKeys.length > 0) {
			currentSetting = settingKeys[0];
			state.update(CURRENT_SETTING_KEY, currentSetting);
		} else {
			return undefined;
		}
	}
	return currentSetting;
}

function isSwitcherIDKey(key: string): boolean
{
   return ((key !== null) &&
           (key !== '') &&
           !isNaN(Number(key.toString())));
}

function getCurrentDefaultSettingObject(currentDefaultSetting: string, settings: vscode.WorkspaceConfiguration) {
	const newDefaultSettings = settings.settings[currentDefaultSetting];
	const newDefaultSettingsKeys = Object.keys(newDefaultSettings);

	let currentSettingObject: any = {};

	newDefaultSettingsKeys.forEach(key => {
		currentSettingObject[key] = newDefaultSettings[key];
	});
	return currentSettingObject;
}

function getUpdatedCurrentSettingObject(context: vscode.ExtensionContext) : any {	
	let settings = vscode.workspace.getConfiguration(SETTINGS_CONFIG_NAME);
	let currentSettingObject: any = {};

	const currentDefaultSetting = getCurrentSetting(context.workspaceState, DEFAULT_SWITCHER_ID);	
	if (currentDefaultSetting !== undefined) {
		currentSettingObject = getCurrentDefaultSettingObject(currentDefaultSetting, settings);
	}

	let switcherIDCounter = DEFAULT_SWITCHER_ID + 1;	
	settings.switcherGroups.forEach((switcherGroup: any) => {
		const currentSwitcherSetting = getCurrentSetting(context.workspaceState, switcherIDCounter);
		if (currentSwitcherSetting !== undefined) {
			currentSettingObject[switcherIDCounter] = switcherGroup[currentSwitcherSetting];		
			switcherIDCounter++;
		}
	});
	if (Object.keys(currentSettingObject).length > 0) {
		return currentSettingObject;
	}
	return undefined;
}

async function updateCurrentSetting (context: vscode.ExtensionContext) {
	const currentSettingObject = getUpdatedCurrentSettingObject(context);
	if (currentSettingObject !== undefined) {
		let settings = vscode.workspace.getConfiguration(SETTINGS_CONFIG_NAME);
		await settings.update(CURRENT_OBJECT_KEY, currentSettingObject, vscode.ConfigurationTarget.Workspace);
	}
}

function updateStatusBarItemText(state: vscode.Memento, switcherID: number) {
	let currentSetting = getCurrentSetting(state, switcherID);
	if (currentSetting !== undefined) {
		statusBarItems[switcherID].text = currentSetting;
	}
}

async function switchSetting(context: vscode.ExtensionContext, switcherID: number) {
	let settingKeys: string[] = [];
	if (switcherID === DEFAULT_SWITCHER_ID) {
		settingKeys = Object.keys(vscode.workspace.getConfiguration(SETTINGS_CONFIG_NAME).settings);
	} else {
		settingKeys = Object.keys(vscode.workspace.getConfiguration(SETTINGS_CONFIG_NAME).switcherGroups[switcherID - 1]);
	}
	const currentSetting = await vscode.window.showQuickPick(settingKeys);
	if (currentSetting === undefined){
		return;
	}
	context.workspaceState.update(CURRENT_SETTING_KEY + switcherID, currentSetting);
	updateStatusBarItemText(context.workspaceState, switcherID);
	updateCurrentSetting(context);
}

function initDefaultSwitcher(context: vscode.ExtensionContext) {
	const commandID = SWITCH_SETTING_ID + DEFAULT_SWITCHER_ID;
	let switchSettingDisposable = vscode.commands.registerCommand(commandID, 
		function () { switchSetting(context, DEFAULT_SWITCHER_ID); });

	context.subscriptions.push(switchSettingDisposable);

	let statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 800);
	statusBarItem.command = commandID;
	statusBarItem.show();
	context.subscriptions.push(statusBarItem);

	statusBarItems.push(statusBarItem);
	
	updateStatusBarItemText(context.workspaceState, DEFAULT_SWITCHER_ID);
}

function initAdditionalSwitcher(context: vscode.ExtensionContext) {	
	let settings = vscode.workspace.getConfiguration(SETTINGS_CONFIG_NAME);
	let switcherIDCounter = DEFAULT_SWITCHER_ID + 1;

	settings.switcherGroups.forEach((switcherGroup: object) => {
		const commandID = SWITCH_SETTING_ID + switcherIDCounter;
		const currentSwitcherID = switcherIDCounter;
		let switchSettingDisposable = vscode.commands.registerCommand(commandID, 
			function () { switchSetting(context, currentSwitcherID); });
	
		context.subscriptions.push(switchSettingDisposable);	
	
		let statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 800);
		statusBarItem.command = commandID;
		statusBarItem.show();
		context.subscriptions.push(statusBarItem);
	
		statusBarItems.push(statusBarItem);

		updateStatusBarItemText(context.workspaceState, currentSwitcherID);

		switcherIDCounter++;
	});
}

export function activate(context: vscode.ExtensionContext) {
	initDefaultSwitcher(context);
	initAdditionalSwitcher(context);
	updateCurrentSetting(context);
}

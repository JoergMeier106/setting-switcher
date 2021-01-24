# Setting Switcher

With this extension it is possible to manage different custom settings in groups. Only one group is active at a time. The active group can be selected via the status bar. This allows to change settings for different scenarios.

## Features

The configuration can be simply done in the settings.json file. "switchSettings.settings" is an object where each key represents a group. Each group can contain any settings. In the following example the three groups CustomSetting1, CustomSetting2 and CustomSetting3 have been defined.
![feature defining_groups](images/settings_example.png)

After the first definition you might have to reload the window.

Switch the current setting group via the status bar.

![feature switching_groups](images/switch_settings_example.gif)

The object "switchSettings.current" will be added/changed after switching the current group.

If you want to access for example the current "Setting1" use the variable:
${config:switchSettings.current.Setting1}. However, this is just an example and any group and setting names are possible.  

### Create Multiple Switcher

If you need to switch more than one setting, you can use the list switchSettings.switcherGroups to create multiple switcher groups. The following example shows how it is possible to switch between CustomSetting1 and CustomSetting2 as well as between CustomSetting3 and CustomSetting4 and CustomSetting5 and CustomSetting6. Note that the use of "switchSettings.settings" is not necessary here and all switcher groups can also be defined only under "switchSettings.switcherGroups".
![feature defining_groups](images/switcher_group_example.png)

For each group a status bar item is created and displayed.
![feature defining_groups](images/switcher_group_status_bar_example.png)

The currently selected settings of the switcher groups are numerated under "config:switchSettings.current". ![feature defining_groups](images/switcher_group_current_example.png)

If you want to access for example the current "Setting3" use the variable:
${config:switchSettings.current.1.Setting3}
/**
 * @format
 */

import { AppRegistry, Image } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

import { PluginManager } from 'sn-plugin-lib';

AppRegistry.registerComponent(appName, () => App);

PluginManager.init();

PluginManager.registerButton(1, ['NOTE', 'DOC'], {
  id: 100,
  name: 'InkGames',
  icon: Image.resolveAssetSource(
    require('./assets/InkGames_icon.png'),
  ).uri,
  showType: 1,
});

PluginManager.registerConfigButton();

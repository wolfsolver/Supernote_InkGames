/**
 * Simple Plugin
 *
 * @format
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Pressable,
  Image,
} from 'react-native';
import { PluginManager } from 'sn-plugin-lib';
import { SettingProvider } from './utils/SettingContext';
import Setting from './module/Setting';
import Main from './module/Main';
import { useSettings } from './utils/SettingContext';
import { log } from './utils/ConsoleLog';

/**
 * Plugin View
 * Displays Hello World text in the center of the screen
 */
function AppContent(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const { settings, updateSettings, isLoading } = useSettings();
  const [currentView, setCurrentView] = useState<'main' | 'settings'>('main');
  const pendingEvents = useRef<any[]>([]);
  const isLoadingRef = useRef(isLoading);
  const updateSettingsRef = useRef(updateSettings);

  const [showSplash, setShowSplash] = useState(true);

  // Keep refs up to date to avoid stale closures in the event listener
  useEffect(() => {
    isLoadingRef.current = isLoading;
    updateSettingsRef.current = updateSettings;
    if (!isLoading) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, updateSettings]);

  const processButtonPress = (event: any) => {
    log('App', 'Processing Button Press: ' + JSON.stringify(event));
    setCurrentView('main');
  };

  useEffect(() => {
    // Process any buffered events when loading finishes
    if (!isLoading && pendingEvents.current.length > 0) {
      log('App', `Processing ${pendingEvents.current.length} buffered events`);
      pendingEvents.current.forEach((event) => {
        processButtonPress(event);
      });
      pendingEvents.current = [];
    }
  }, [isLoading]);

  useEffect(() => {
    // Listen for the Config (Gear) button click
    const configSub = PluginManager.registerConfigButtonListener({
      onClick: () => {
        setCurrentView('settings');
      },
    });

    // Listen for custom toolbar buttons (like our Home button ID: 100)
    const buttonSub = PluginManager.registerButtonListener({
      onButtonPress: (event) => {
        log('App', 'Button Pressed: ' + JSON.stringify(event));
        if (isLoadingRef.current) {
          log('App', 'Settings still loading, buffering event');
          pendingEvents.current.push(event);
        } else {
          processButtonPress(event);
        }
      },
    });

    return () => {
      configSub.remove();
      buttonSub.remove();
    };
  }, []);

  const handleClose = () => {
    setCurrentView('main');
    PluginManager.closePluginView();
  };


  // 1. Splash Screen (Priorità massima all'avvio)
  if (showSplash) {
    return (
      <View style={styles.splashContainer}>
        <Image
          source={require('./assets/InkGames.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.closeButton} onPress={handleClose}>
        <Text style={[styles.closeText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>✕</Text>
      </Pressable>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#000000' : '#ffffff'}
      />
      {isLoading ? (
        <View style={styles.loader}><Text>Loading Settings...</Text></View>
      ) : (
        currentView === 'main' ? (
          <Main onClose={handleClose} />
        ) : (
          <Setting onClose={handleClose} />
        )
      )}
    </View>
  );
}

function App(): React.JSX.Element {
  return (
    <SettingProvider>
      <AppContent />
    </SettingProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff', // E-ink preferisce sfondi solidi
  },
  logo: {
    width: 768,
    height: 768,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  closeText: {
    fontSize: 18,
    fontWeight: '600',
  },
  helloText: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default App;

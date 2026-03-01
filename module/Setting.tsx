import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable, TextInput, StatusBar, useColorScheme } from 'react-native';
import { log } from '../utils/ConsoleLog';
import { useSettings } from '../utils/SettingContext';
import { GAMES_CONFIG } from '../config/defaultSettings';
import pluginConfig from '../PluginConfig.json';
import SettingsToggle from '../utils/SettingsToggle';

interface SettingProps {
  onClose: () => void;
}

const Setting = ({ onClose }: SettingProps) => {
  log("Setting", "Opening");
  const isDarkMode = useColorScheme() === 'dark';

  const { settings, updateSettings, isLoading, resetToDefault } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);

  // Update local settings if global settings change (e.g. after loading or reset)
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  if (isLoading) return <View style={styles.container}><Text>Loading...</Text></View>;

  const handleClose = async () => {
    log("Setting", "Exit without saving");
    onClose();
  };

  const handleSaveAndClose = async () => {
    log("Setting", "Saving and closing");
    await updateSettings(localSettings);
    onClose();
  };

  const handleRestore = async () => {
    log("Setting", "Restoring defaults");
    await resetToDefault();
    // settings will update, and useEffect will update localSettings
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.closeButton} onPress={handleClose}>
        <Text style={[styles.closeText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>✕</Text>
      </Pressable>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#000000' : '#ffffff'}
      />

      <View style={styles.header}>
        <Text style={styles.title}>[{pluginConfig.name}] Settings </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
          >
            <Text style={styles.restoreButtonText}>Restore Defaults</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exitButton}
            onPress={handleSaveAndClose}
          >
            <Text style={styles.exitButtonText}>Exit</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <SettingsToggle
            label={GAMES_CONFIG.SudokuGen.title || ''}
            value={localSettings.SudokuGen}
            onToggle={() => setLocalSettings(prev => ({ ...prev, SudokuGen: !prev.SudokuGen }))}
          />
        </View>
        <View style={styles.row}>
          <SettingsToggle
            label={GAMES_CONFIG.SudokuOnLine.title || ''}
            value={localSettings.SudokuOnLine}
            onToggle={() => setLocalSettings(prev => ({ ...prev, SudokuOnLine: !prev.SudokuOnLine }))}
          />
        </View>
        <View style={styles.row}>
          <SettingsToggle
            label={GAMES_CONFIG.AMazeJs.title || ''}
            value={localSettings.AMazeJs}
            onToggle={() => setLocalSettings(prev => ({ ...prev, AMazeJs: !prev.AMazeJs }))}
          />
        </View>
        <View style={styles.row}>
          <SettingsToggle
            label={GAMES_CONFIG.GenerateMaze.title || ''}
            value={localSettings.GenerateMaze}
            onToggle={() => setLocalSettings(prev => ({ ...prev, GenerateMaze: !prev.GenerateMaze }))}
          />
        </View>
        <View style={styles.row}>
          <SettingsToggle
            label={GAMES_CONFIG.WordFind.title || ''}
            value={localSettings.WordFind}
            onToggle={() => setLocalSettings(prev => ({ ...prev, WordFind: !prev.WordFind }))}
          />
        </View>
        <View style={[styles.row, !localSettings.WordFind && { opacity: 0.5 }]}>
          <Text>Wordlist (txt file):</Text>
          <TextInput
            style={styles.input}
            editable={localSettings.WordFind}
            value={localSettings.WordFind_Dictionaty}
            onChangeText={(val) => {
              setLocalSettings(prev => ({ ...prev, WordFind_Dictionaty: val }));
            }}
          />
        </View>
        <View style={styles.row}>
          <SettingsToggle
            label={GAMES_CONFIG.Nonogram.title || ''}
            value={localSettings.Nonogram}
            onToggle={() => setLocalSettings(prev => ({ ...prev, Nonogram: !prev.Nonogram }))}
          />
        </View>
      </View>
      <View style={styles.row}>
        <Text>by: {pluginConfig.author}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  toggleWrapper: { flexDirection: 'row', alignItems: 'center' },
  statusText: { marginRight: 10, fontWeight: 'bold', width: 30 },
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 20 },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  section: { width: '100%', marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10 },
  input: { borderBottomWidth: 1, borderColor: '#ccc', minWidth: 100, textAlign: 'right' },
  info: { marginTop: 10, fontStyle: 'italic' },
  exitButton: { backgroundColor: '#000', paddingVertical: 8, paddingHorizontal: 20, alignItems: 'center', borderRadius: 4 },
  exitButtonText: { color: '#FFF', fontWeight: 'bold' },
  restoreButton: { backgroundColor: '#eee', paddingVertical: 8, paddingHorizontal: 15, alignItems: 'center', borderRadius: 4, borderWidth: 1, borderColor: '#ccc' },
  restoreButtonText: { color: '#000', fontWeight: '500' },
  switch: {
    width: 60,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  switchOn: {
    backgroundColor: '#000',
  },
  switchOff: {
    backgroundColor: '#333',
  },
  handle: {
    width: 22,
    height: 22,
    backgroundColor: '#fff',
    borderRadius: 11,
  },
  handleOn: {
    alignSelf: 'flex-end',
  },
  handleOff: {
    alignSelf: 'flex-start',
  },
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
});

export default Setting;
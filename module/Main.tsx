import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, useColorScheme, FlatList, StatusBar } from 'react-native';
import { log } from '../utils/ConsoleLog';
import { useSettings } from '../utils/SettingContext';
import { GAMES_CONFIG } from '../config/defaultSettings';
//import config from '../app.json';
import pluginConfig from '../PluginConfig.json';
import SudokuView from './SudokuGen/SudokuView';
import SudokuOnLineView from './SudokuOnLine/SudokuOnLineView';
import AMazeView from './AMazeJs/AMazeView';

interface MainProps {
    onClose: () => void;
}

const Main = ({ onClose }: MainProps) => {
    log("Main", "Rendering Grid Menu");
    const isDarkMode = useColorScheme() === 'dark';
    const { settings } = useSettings();
    //    const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
    const [selectedGame, setSelectedGame] = React.useState<string | null>(null);

    const handleClose = async () => {
        log("Main", "Exit");
        onClose();
    };

    // Filtriamo i giochi: mostriamo solo quelli che hanno il flag 'true' nei settings
    const activeGames = Object.entries(GAMES_CONFIG)
        .filter(([id]) => settings[id as keyof typeof settings] === true)
        .map(([id, config]) => ({
            id,
            ...config,
        }));

    const handleSelectGame = (gameId: string) => {
        log("Main", `Selected game: ${gameId}`);
        setSelectedGame(gameId);
    };

    const renderGameItem = ({ item }: { item: any }) => (
        <Pressable
            style={[
                styles.gameCard,
                { borderColor: isDarkMode ? '#ffffff' : '#000000' }
            ]}
            onPress={() => handleSelectGame(item.id)}
        >
            <Text style={styles.gameIcon}>{item.icon}</Text>
            <Text style={[styles.gameTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                {item.title}
            </Text>
        </Pressable>
    );

    if (selectedGame === 'SudokuGen') {
        return <SudokuView onBack={() => setSelectedGame(null)} />;
    }

    if (selectedGame === 'SudokuOnLine') {
        return <SudokuOnLineView onBack={() => setSelectedGame(null)} />;
    }

    if (selectedGame === 'AMazeJs') {
        return <AMazeView onBack={() => setSelectedGame(null)} />;
    }

    return (
        <View style={[styles.container, { backgroundColor: isDarkMode ? '#000000' : '#ffffff' }]}>

            <Pressable style={styles.closeButton} onPress={handleClose}>
                <Text style={[styles.closeText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>✕</Text>
            </Pressable>
            <StatusBar
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                backgroundColor={isDarkMode ? '#000000' : '#ffffff'}
            />

            <Text style={[styles.headerText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                InkGames
            </Text>

            <FlatList
                data={activeGames}
                renderItem={renderGameItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>No games enabled in settings.</Text>
                }
            />

            <View style={styles.footer}>
                <Text style={styles.footerNote}>
                    Select a game to generate a new paper-style puzzle. By: {pluginConfig.author}
                </Text>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        paddingTop: 80, // Spazio per non sovrapporsi al tasto chiusura di App.tsx
    },
    headerText: {
        fontSize: 42,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 30,
        letterSpacing: 1,
    },
    listContainer: {
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    gameCard: {
        width: 320, // Dimensione generosa per lo stilo
        height: 180,
        margin: 15,
        borderWidth: 2,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    gameIcon: {
        fontSize: 48,
        marginBottom: 8,
    },
    gameTitle: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        paddingHorizontal: 10,
    },
    footer: {
        padding: 40,
        alignItems: 'center',
    },
    footerNote: {
        fontSize: 16,
        color: '#666',
        fontStyle: 'italic',
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

export default Main;
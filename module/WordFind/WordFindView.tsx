/**
 * module/WordFind/WordFindView.tsx
 */
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView, StatusBar } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { generateWordFind, WordFindPuzzle } from './WordFindEngine';
import { log } from '../../utils/ConsoleLog';
import { PluginManager, PluginNoteAPI } from 'sn-plugin-lib';
import { GAMES_CONFIG } from '../../config/defaultSettings';
import pluginConfig from '../../PluginConfig.json';
import { getDirPath, saveObjectTo } from '../../utils/Storage';
import { useSettings } from '../../utils/SettingContext';

interface WordFindViewProps {
    onBack: () => void;
}

const WordFindView = ({ onBack }: WordFindViewProps) => {
    const { settings, isLoading } = useSettings();
    const [gridSize, setGridSize] = useState(12);
    const [numWords, setNumWords] = useState(10);
    const [puzzle, setPuzzle] = useState<WordFindPuzzle | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [hasInited, setHasInited] = useState(false);
    const viewRef = useRef<View>(null);

    useEffect(() => {
        if (!isLoading && !hasInited) {
            handleGenerate(12, 10);
            setHasInited(true);
        }
    }, [isLoading]);

    const handleGenerate = (size: number, count: number) => {
        setIsGenerating(true);
        setGridSize(size);
        setNumWords(count);

        setTimeout(() => {
            try {
                const newPuzzle = generateWordFind(count, size, size);
                setPuzzle(newPuzzle);
            } catch (e) {
                log("WordFind", "Generation error: " + e);
            } finally {
                setIsGenerating(false);
            }
        }, 50);
    };

    const handleExport = async () => {
        if (!puzzle || !viewRef.current) return;
        setIsExporting(true);

        try {
            const base64Data = await captureRef(viewRef, {
                format: "png",
                result: "base64",
            });

            const dirPath = await getDirPath();
            const filePath = `${dirPath}/WordFind.png`;
            await saveObjectTo("base64", base64Data, filePath);

            await PluginNoteAPI.insertImage(filePath);
            PluginManager.closePluginView();
        } catch (e) {
            log("WordFind", "Error during export: " + e);
        } finally {
            setIsExporting(false);
        }
    };

    const renderGrid = () => {
        if (!puzzle) return null;

        const cellSize = Math.floor(600 / gridSize); // Max width ~600
        const now = new Date();
        const dateStr = now.toLocaleDateString();

        return (
            <View ref={viewRef} collapsable={false} style={styles.captureContainer}>
                <View style={styles.gridHeader}>
                    <Text style={styles.title}>{GAMES_CONFIG.WordFind.title}</Text>
                    <Text style={styles.headerText}>{dateStr}</Text>
                </View>

                <View style={[styles.gridBoard, { width: gridSize * cellSize + 4 }]}>
                    {puzzle.grid.map((row, rowIndex) => (
                        <View key={`row-${rowIndex}`} style={styles.row}>
                            {row.map((char, colIndex) => (
                                <View
                                    key={`cell-${rowIndex}-${colIndex}`}
                                    style={[styles.cell, { width: cellSize, height: cellSize }]}
                                >
                                    <Text style={[styles.cellText, { fontSize: cellSize * 0.6 }]}>
                                        {char.toUpperCase()}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    ))}
                </View>

                <View style={styles.wordListContainer}>
                    <Text style={styles.wordListTitle}>WORDS TO FIND:</Text>
                    <View style={styles.wordList}>
                        {puzzle.words.map((word, i) => (
                            <Text key={i} style={styles.wordListItem}>
                                □ {word.toUpperCase()}
                            </Text>
                        ))}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Pressable style={styles.closeButton} onPress={onBack}>
                <Text style={styles.closeText}>✕</Text>
            </Pressable>
            <StatusBar barStyle={'dark-content'} backgroundColor={'#ffffff'} />

            <Text style={styles.title}>{GAMES_CONFIG.WordFind.title}</Text>
            <Text style={styles.subtitle}>v{pluginConfig.versionName}</Text>

            {isLoading ? (
                <View style={styles.initialLoader}>
                    <ActivityIndicator size="large" color="#000" />
                    <Text style={styles.loaderText}>Loading...</Text>
                </View>
            ) : puzzle ? (
                <>
                    {renderGrid()}

                    <View style={styles.controls}>
                        <Text style={styles.label}>Grid Size:</Text>
                        <View style={styles.buttonGrid}>
                            <Pressable style={[styles.miniBtn, gridSize === 10 && styles.activeBtn]} onPress={() => handleGenerate(10, 8)}>
                                <Text style={styles.miniBtnText}>10x10</Text>
                            </Pressable>
                            <Pressable style={[styles.miniBtn, gridSize === 12 && styles.activeBtn]} onPress={() => handleGenerate(12, 10)}>
                                <Text style={styles.miniBtnText}>12x12</Text>
                            </Pressable>
                            <Pressable style={[styles.miniBtn, gridSize === 15 && styles.activeBtn]} onPress={() => handleGenerate(15, 12)}>
                                <Text style={styles.miniBtnText}>15x15</Text>
                            </Pressable>
                        </View>

                        <Pressable
                            style={[styles.exportBtn, (isExporting || isGenerating) && styles.disabledBtn]}
                            onPress={handleExport}
                            disabled={isExporting || isGenerating}
                        >
                            {isExporting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.exportBtnText}>INSERT INTO NOTE</Text>}
                        </Pressable>
                    </View>
                </>
            ) : (
                <View style={styles.initialLoader}>
                    <ActivityIndicator size="large" color="#000" />
                    <Text style={styles.loaderText}>Generating puzzle...</Text>
                </View>
            )}

            <Pressable onPress={onBack} style={styles.backBtn}>
                <Text style={styles.backBtnText}>← Back to Menu</Text>
            </Pressable>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { alignItems: 'center', paddingVertical: 40, backgroundColor: '#FFF' },
    title: { fontSize: 28, fontWeight: '800' },
    subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
    captureContainer: { backgroundColor: '#FFF', padding: 20, alignItems: 'center' },
    gridHeader: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    headerText: { fontSize: 16, fontWeight: 'bold' },
    gridBoard: { borderWidth: 2, borderColor: '#000' },
    row: { flexDirection: 'row' },
    cell: { borderWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
    cellText: { fontWeight: 'bold', color: '#000' },
    wordListContainer: { marginTop: 30, width: '100%', paddingHorizontal: 10 },
    wordListTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, borderBottomWidth: 2 },
    wordList: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
    wordListItem: { fontSize: 16, fontWeight: '500', minWidth: '45%' },
    controls: { marginTop: 30, alignItems: 'center', width: '100%' },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
    buttonGrid: { flexDirection: 'row', gap: 10, marginBottom: 30 },
    miniBtn: { paddingHorizontal: 15, paddingVertical: 10, borderWidth: 2, borderColor: '#000', borderRadius: 8 },
    activeBtn: { backgroundColor: '#000' },
    miniBtnText: { fontWeight: 'bold' },
    exportBtn: { width: 300, height: 60, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
    exportBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
    disabledBtn: { backgroundColor: '#AAA' },
    backBtn: { marginTop: 40, padding: 10 },
    backBtnText: { textDecorationLine: 'underline' },
    closeButton: { position: 'absolute', top: 12, right: 12, padding: 10 },
    closeText: { fontSize: 20, fontWeight: 'bold' },
    initialLoader: {
        marginTop: 100,
        alignItems: 'center',
        gap: 20,
    },
    loaderText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000',
    },
});

export default WordFindView;

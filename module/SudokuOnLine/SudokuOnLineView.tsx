// module/SudokuOnLine/SudokuOnLineView.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView, StatusBar } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { fetchSudokuOnline, SudokuOnlinePuzzle } from './SudokuAPI';
import { log } from '../../utils/ConsoleLog';
import { PluginManager, PluginNoteAPI } from 'sn-plugin-lib';
import { GAMES_CONFIG } from '../../config/defaultSettings';
import pluginConfig from '../../PluginConfig.json';
import { getDirPath, saveObjectTo } from '../../utils/Storage';

interface SudokuOnLineViewProps {
    onBack: () => void;
}

const SudokuOnLineView = ({ onBack }: SudokuOnLineViewProps) => {
    const [puzzle, setPuzzle] = useState<SudokuOnlinePuzzle | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const viewRef = useRef<View>(null);

    // Fetch initial puzzle
    useEffect(() => {
        handleFetch();
    }, []);

    const handleFetch = async () => {
        setIsFetching(true);
        log("SudokuOnline", "Calling Sudoku API...");
        try {
            const newPuzzle = await fetchSudokuOnline();
            if (newPuzzle) {
                setPuzzle(newPuzzle);
            }
        } catch (e) {
            log("SudokuOnline", "Fetch error: " + e);
        } finally {
            setIsFetching(false);
        }
    };

    const handleExport = async () => {
        if (!puzzle || !viewRef.current) return;
        setIsExporting(true);

        try {
            log("SudokuOnline", "Capturing PNG from view...");
            const base64Data = await captureRef(viewRef, {
                format: "png",
                result: "base64",
            });

            const dirPath = await getDirPath();
            const filePath = `${dirPath}/SudokuOnline.png`;
            saveObjectTo("base64", base64Data, filePath);

            log("SudokuOnline", "Inserting image into note...");
            await PluginNoteAPI.insertImage(filePath);

            PluginManager.closePluginView();
        } catch (e) {
            log("SudokuOnline", "Error during export: " + e);
        } finally {
            setIsExporting(false);
        }
    };

    const renderGrid = () => {
        if (!puzzle) return null;

        const cells = puzzle.puzzle.split('');
        const now = new Date();
        const dateStr = now.toLocaleDateString();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
            <View ref={viewRef} collapsable={false} style={styles.captureContainer}>
                <View style={styles.row}>
                    <Text style={styles.title}>{GAMES_CONFIG.SudokuOnLine.title}</Text>
                </View>
                <View style={styles.gridHeader}>
                    <Text style={styles.headerText}>LEVEL: {puzzle.difficulty.toUpperCase()} (Online)</Text>
                    <Text style={styles.headerText}>{dateStr} {timeStr}</Text>
                </View>
                <View style={styles.gridBoard}>
                    {Array.from({ length: 9 }).map((_, rowIndex) => (
                        <View key={`row-${rowIndex}`} style={styles.row}>
                            {cells.slice(rowIndex * 9, (rowIndex + 1) * 9).map((char: string, colIndex: number) => {
                                const isRightEdge = (colIndex + 1) % 3 === 0 && colIndex < 8;
                                const isBottomEdge = (rowIndex + 1) % 3 === 0 && rowIndex < 8;

                                return (
                                    <View
                                        key={`cell-${rowIndex}-${colIndex}`}
                                        style={[
                                            styles.cell,
                                            isRightEdge && styles.thickRight,
                                            isBottomEdge && styles.thickBottom
                                        ]}
                                    >
                                        <Text style={styles.cellText}>
                                            {char === '.' ? '' : char}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Pressable style={styles.closeButton} onPress={onBack}>
                <Text style={[styles.closeText, { color: '#000000' }]}>✕</Text>
            </Pressable>
            <StatusBar barStyle={'dark-content'} backgroundColor={'#ffffff'} />

            <Text style={styles.title}>{GAMES_CONFIG.SudokuOnLine.title}</Text>
            <Text style={styles.subtitle}>v{pluginConfig.versionName} by {pluginConfig.author}</Text>

            {puzzle ? (
                <>
                    <Text style={styles.subtitle}>Difficulty: {puzzle.difficulty}</Text>
                    {renderGrid()}

                    <View style={styles.controls}>
                        <Pressable
                            style={[styles.fetchBtn, (isExporting || isFetching) && styles.disabledBtn]}
                            onPress={handleFetch}
                            disabled={isExporting || isFetching}
                        >
                            {isFetching ? (
                                <View style={styles.inlineLoader}>
                                    <ActivityIndicator color="#000" size="small" />
                                    <Text style={styles.fetchBtnText}>Fetching...</Text>
                                </View>
                            ) : (
                                <Text style={styles.fetchBtnText}>GET NEW ONLINE SUDOKU</Text>
                            )}
                        </Pressable>

                        <Pressable
                            style={[styles.exportBtn, (isExporting || isFetching) && styles.disabledBtn]}
                            onPress={handleExport}
                            disabled={isExporting || isFetching}
                        >
                            {isExporting ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.exportBtnText}>INSERT INTO NOTE</Text>
                            )}
                        </Pressable>
                    </View>
                </>
            ) : (
                <View style={styles.initialLoader}>
                    <ActivityIndicator size="large" color="#000" />
                    <Text style={styles.loaderText}>Fetching Sudoku from Online API...</Text>
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
    title: { fontSize: 28, fontWeight: '800', marginBottom: 5 },
    subtitle: { fontSize: 16, color: '#666', marginBottom: 20, textTransform: 'uppercase' },
    captureContainer: { backgroundColor: '#FFF', padding: 10, alignItems: 'center' },
    gridHeader: { flexDirection: 'row', justifyContent: 'space-between', width: 546, marginBottom: 10, paddingHorizontal: 2 },
    headerText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
    gridBoard: { borderWidth: 4, borderColor: '#000', backgroundColor: '#FFF' },
    row: { flexDirection: 'row' },
    cell: { width: 60, height: 60, borderWidth: 1.5, borderColor: '#888', justifyContent: 'center', alignItems: 'center' },
    cellText: { fontSize: 24, fontWeight: 'bold', color: '#000' },
    thickRight: { borderRightWidth: 4, borderRightColor: '#000' },
    thickBottom: { borderBottomWidth: 4, borderBottomColor: '#000' },
    controls: { marginTop: 30, alignItems: 'center', width: '100%' },
    fetchBtn: { width: 300, height: 60, backgroundColor: '#FFF', borderWidth: 2, borderColor: '#000', justifyContent: 'center', alignItems: 'center', borderRadius: 10, marginBottom: 15 },
    fetchBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
    exportBtn: { width: 300, height: 70, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
    exportBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
    inlineLoader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    disabledBtn: { backgroundColor: '#AAA', borderColor: '#AAA' },
    backBtn: { marginTop: 40, padding: 10 },
    backBtnText: { textDecorationLine: 'underline', color: '#000' },
    initialLoader: { marginTop: 100, alignItems: 'center', gap: 20 },
    loaderText: { fontSize: 14, fontWeight: 'bold', color: '#000' },
    closeButton: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
    closeText: { fontSize: 18, fontWeight: '600' },
});

export default SudokuOnLineView;

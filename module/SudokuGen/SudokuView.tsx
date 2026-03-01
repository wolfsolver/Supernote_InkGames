import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView, StatusBar } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { generateSudoku, SudokuPuzzle } from './SudokuEngine';
import { log } from '../../utils/ConsoleLog';
import { PluginManager, PluginNoteAPI } from 'sn-plugin-lib';
import { GAMES_CONFIG } from '../../config/defaultSettings';
import pluginConfig from '../../PluginConfig.json';
import { getDirPath, saveObjectTo } from '../../utils/Storage';
import { useSettings } from '../../utils/SettingContext';

interface SudokuViewProps {
    onBack: () => void;
}

const SudokuView = ({ onBack }: SudokuViewProps) => {
    const { settings, updateSettings } = useSettings();
    const [givens, setGivens] = useState(settings.SudokuGen_DefaultDifficulty);
    const [puzzle, setPuzzle] = useState<SudokuPuzzle | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const viewRef = useRef<View>(null);

    // Genera un puzzle all'avvio (default Easy)
    useEffect(() => {
        handleGenerate(settings.SudokuGen_DefaultDifficulty);
    }, []);

    const handleGenerate = (diff: number) => {
        setIsGenerating(true);
        log("Sudoku", `Generating new puzzle: ${diff}`);

        // Usiamo un timeout per permettere alla UI di mostrare lo stato di caricamento
        // dato che generateSudoku è un'operazione sincrona pesante
        setTimeout(() => {
            log("Sudoku", "Starting new generation");
            try {
                const newPuzzle = generateSudoku(diff);
                setPuzzle(newPuzzle);
                setGivens(diff);
                updateSettings({ SudokuGen_DefaultDifficulty: diff });
                log("Sudoku", "Puzzle generated: " + newPuzzle.puzzle);
            } catch (e) {
                log("Sudoku", "Generation error: " + e);
            } finally {
                setIsGenerating(false);
                log("Sudoku", "Generation finished");
            }
        }, 50);
    };

    const handleExport = async () => {
        if (!puzzle || !viewRef.current) return;
        setIsExporting(true);

        try {
            log("Sudoku", "Capturing PNG from view...");

            // Cattura la grid come PNG
            const base64Data = await captureRef(viewRef, {
                format: "png",
                result: "base64",
            });

            const dirPath = await getDirPath();
            const filePath = `${dirPath}/SudokuGen.png`;
            //const filePath = '/storage/self/primary/MyStyle/Immagini/SudokuGen.png';

            saveObjectTo("base64", base64Data, filePath);

            log("Sudoku", "Captured URI: " + filePath);

            log("Sudoku", "Inserting image into note...");
            await PluginNoteAPI.insertImage(filePath);

            log("Sudoku", "Export completed!");

            PluginManager.closePluginView();
            log("Sudoku", "Plugin view closed");

        } catch (e) {
            log("Sudoku", "Error during export: " + e);
        } finally {
            setIsExporting(false);
        }
    };

    const renderGrid = () => {
        if (!puzzle) return null;

        const cells = puzzle.puzzle.split(''); // Splitta la stringa di 81 caratteri
        const now = new Date();
        const dateStr = now.toLocaleDateString();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
            <View ref={viewRef} collapsable={false} style={styles.captureContainer}>
                <View style={styles.row}>
                    <Text style={styles.title}>{GAMES_CONFIG.SudokuGen.title}</Text>
                </View>
                <View style={styles.gridHeader}>
                    <Text style={styles.headerText}>LEVEL: {puzzle.difficulty}</Text>
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
            <StatusBar
                barStyle={'dark-content'}
                backgroundColor={'#ffffff'}
            />

            <Text style={styles.title}>{GAMES_CONFIG.SudokuGen.title}</Text>
            <Text style={styles.subtitle}>v{pluginConfig.versionName} by {pluginConfig.author}</Text>

            {puzzle ? (
                <>
                    <Text style={styles.subtitle}>Difficulty: {puzzle.difficulty}</Text>

                    {renderGrid()}

                    <View style={styles.controls}>
                        <Text style={styles.label}>Select Difficulty:</Text>
                        <View style={styles.buttonGrid}>
                            <Pressable
                                style={[styles.miniBtn, isGenerating && styles.disabledBtn]}
                                onPress={() => handleGenerate(62)}
                                disabled={isGenerating}
                            >
                                <Text style={styles.miniBtnText}>Easy</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.miniBtn, isGenerating && styles.disabledBtn]}
                                onPress={() => handleGenerate(53)}
                                disabled={isGenerating}
                            >
                                <Text style={styles.miniBtnText}>Medium</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.miniBtn, isGenerating && styles.disabledBtn]}
                                onPress={() => handleGenerate(44)}
                                disabled={isGenerating}
                            >
                                <Text style={styles.miniBtnText}>Hard</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.miniBtn, isGenerating && styles.disabledBtn]}
                                onPress={() => handleGenerate(35)}
                                disabled={isGenerating}
                            >
                                <Text style={styles.miniBtnText}>V. Hard</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.miniBtn, isGenerating && styles.disabledBtn]}
                                onPress={() => handleGenerate(26)}
                                disabled={isGenerating}
                            >
                                <Text style={styles.miniBtnText}>Insane</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.miniBtn, isGenerating && styles.disabledBtn]}
                                onPress={() => handleGenerate(17)}
                                disabled={isGenerating}
                            >
                                <Text style={styles.miniBtnText}>Inhuman</Text>
                            </Pressable>
                        </View>

                        {isGenerating && (
                            <View style={styles.loaderContainer}>
                                <ActivityIndicator color="#000" size="small" />
                                <Text style={styles.loaderText}>Creating Puzzle...</Text>
                            </View>
                        )}

                        <Pressable
                            style={[styles.exportBtn, (isExporting || isGenerating) && styles.disabledBtn]}
                            onPress={handleExport}
                            disabled={isExporting || isGenerating}
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
                    <Text style={styles.loaderText}>Creating your first puzzle...</Text>
                </View>
            )}

            <Pressable onPress={onBack} style={styles.backBtn}>
                <Text style={styles.backBtnText}>← Back to Menu</Text>
            </Pressable>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: 40,
        backgroundColor: '#FFF',
    },
    title: { fontSize: 28, fontWeight: '800', marginBottom: 5 },
    subtitle: { fontSize: 16, color: '#666', marginBottom: 20, textTransform: 'uppercase' },
    captureContainer: {
        backgroundColor: '#FFF',
        padding: 10,
        alignItems: 'center',
    },
    gridHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: 60 * 9 + 6, // 546px wide
        marginBottom: 10,
        paddingHorizontal: 2,
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    gridBoard: {
        borderWidth: 4,
        borderColor: '#000',
        backgroundColor: '#FFF',
    },
    row: { flexDirection: 'row' },
    cell: {
        width: 60,
        height: 60,
        borderWidth: 1.5,
        borderColor: '#888',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cellText: { fontSize: 24, fontWeight: 'bold', color: '#000' },
    thickRight: { borderRightWidth: 4, borderRightColor: '#000' },
    thickBottom: { borderBottomWidth: 4, borderBottomColor: '#000' },
    controls: { marginTop: 30, alignItems: 'center', width: '100%' },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
    miniBtnText: { fontWeight: 'bold', fontSize: 13 },
    buttonGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        width: '100%',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    miniBtn: {
        width: '30%',
        paddingVertical: 12,
        borderWidth: 2,
        borderColor: '#000',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
    },
    loaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
    },
    loaderText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000',
    },
    initialLoader: {
        marginTop: 100,
        alignItems: 'center',
        gap: 20,
    },
    exportBtn: {
        width: 300,
        height: 70,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
    },
    exportBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
    disabledBtn: { backgroundColor: '#AAA', borderColor: '#AAA' },
    backBtn: { marginTop: 40, padding: 10 },
    backBtnText: { textDecorationLine: 'underline', color: '#000' },
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

export default SudokuView;
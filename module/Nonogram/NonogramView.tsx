/**
 * module/Nonogram/NonogramView.tsx
 */
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView, StatusBar } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { generateNonogram, NonogramPuzzle } from './NonogramEngine';
import { log } from '../../utils/ConsoleLog';
import { PluginManager, PluginNoteAPI } from 'sn-plugin-lib';
import { GAMES_CONFIG } from '../../config/defaultSettings';
import pluginConfig from '../../PluginConfig.json';
import { getDirPath, saveObjectTo } from '../../utils/Storage';
import { useSettings } from '../../utils/SettingContext';

interface NonogramViewProps {
    onBack: () => void;
}

const NonogramView = ({ onBack }: NonogramViewProps) => {
    const { isLoading } = useSettings();
    const [size, setSize] = useState(10);
    const [puzzle, setPuzzle] = useState<NonogramPuzzle | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [hasInited, setHasInited] = useState(false);
    const viewRef = useRef<View>(null);

    useEffect(() => {
        if (!isLoading && !hasInited) {
            handleGenerate(10);
            setHasInited(true);
        }
    }, [isLoading]);

    const handleGenerate = (newSize: number) => {
        setIsGenerating(true);
        setSize(newSize);
        setTimeout(() => {
            try {
                const newPuzzle = generateNonogram(newSize, newSize);
                setPuzzle(newPuzzle);
            } catch (e) {
                log("Nonogram", "Generation error: " + e);
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
            const filePath = `${dirPath}/Nonogram.png`;
            await saveObjectTo("base64", base64Data, filePath);
            await PluginNoteAPI.insertImage(filePath);
            PluginManager.closePluginView();
        } catch (e) {
            log("Nonogram", "Error during export: " + e);
        } finally {
            setIsExporting(false);
        }
    };

    const renderGrid = () => {
        if (!puzzle) return null;

        const maxRowHints = Math.max(...puzzle.rowHints.map(h => h.length));
        const maxColHints = Math.max(...puzzle.columnHints.map(h => h.length));

        const cellSize = Math.floor(500 / (puzzle.width + maxRowHints));
        const now = new Date();

        return (
            <View ref={viewRef} collapsable={false} style={styles.captureContainer}>
                <View style={styles.headerRow}>
                    <Text style={styles.title}>{GAMES_CONFIG.Nonogram.title}</Text>
                    <Text style={styles.dateText}>{now.toLocaleDateString()}</Text>
                </View>

                <View style={styles.board}>
                    {/* Top Hints */}
                    <View style={styles.row}>
                        <View style={{ width: maxRowHints * cellSize, height: maxColHints * cellSize }} />
                        {puzzle.columnHints.map((hints, i) => (
                            <View key={`col-hint-${i}`} style={[styles.colHintCell, { width: cellSize, height: maxColHints * cellSize }]}>
                                {Array.from({ length: maxColHints - hints.length }).map((_, j) => (
                                    <View key={`empty-${j}`} style={{ height: cellSize }} />
                                ))}
                                {hints.map((h, j) => (
                                    <View key={`h-${j}`} style={[styles.hintNumBox, { height: cellSize }]}>
                                        <Text style={[styles.hintText, { fontSize: cellSize * 0.7 }]}>{h}</Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>

                    {/* Left Hints and Grid */}
                    {puzzle.rowHints.map((hints, rowIndex) => (
                        <View key={`row-${rowIndex}`} style={styles.row}>
                            {/* Row Hints */}
                            <View style={[styles.rowHintCell, { width: maxRowHints * cellSize, height: cellSize }]}>
                                {Array.from({ length: maxRowHints - hints.length }).map((_, j) => (
                                    <View key={`empty-${j}`} style={{ width: cellSize }} />
                                ))}
                                {hints.map((h, j) => (
                                    <View key={`h-${j}`} style={[styles.hintNumBox, { width: cellSize, height: cellSize }]}>
                                        <Text style={[styles.hintText, { fontSize: cellSize * 0.7 }]}>{h}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* Grid Cells */}
                            {Array.from({ length: puzzle.width }).map((_, colIndex) => (
                                <View
                                    key={`cell-${rowIndex}-${colIndex}`}
                                    style={[
                                        styles.cell,
                                        { width: cellSize, height: cellSize },
                                        (colIndex + 1) % 5 === 0 && colIndex < puzzle.width - 1 && styles.boldRight,
                                        (rowIndex + 1) % 5 === 0 && rowIndex < puzzle.height - 1 && styles.boldBottom
                                    ]}
                                />
                            ))}
                        </View>
                    ))}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Rules: Color the cells according to the numbers. Groups of colored cells are separated by at least one empty cell.</Text>
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

            <Text style={styles.title}>{GAMES_CONFIG.Nonogram.title}</Text>
            <Text style={styles.subtitle}>v{pluginConfig.versionName}</Text>

            {isLoading ? (
                <View style={styles.initialLoader}>
                    <ActivityIndicator size="large" color="#000" />
                </View>
            ) : puzzle ? (
                <>
                    {renderGrid()}

                    <View style={styles.controls}>
                        <Text style={styles.label}>Select Size:</Text>
                        <View style={styles.buttonGrid}>
                            <Pressable style={[styles.miniBtn, size === 5 && styles.activeBtn]} onPress={() => handleGenerate(5)}>
                                <Text style={styles.miniBtnText}>5x5</Text>
                            </Pressable>
                            <Pressable style={[styles.miniBtn, size === 10 && styles.activeBtn]} onPress={() => handleGenerate(10)}>
                                <Text style={styles.miniBtnText}>10x10</Text>
                            </Pressable>
                            <Pressable style={[styles.miniBtn, size === 15 && styles.activeBtn]} onPress={() => handleGenerate(15)}>
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
                    <Text>Generating...</Text>
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
    captureContainer: { backgroundColor: '#FFF', padding: 25, alignItems: 'center' },
    headerRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    dateText: { fontSize: 16, fontWeight: '600' },
    board: { borderLeftWidth: 3, borderTopWidth: 3, borderColor: '#000' },
    row: { flexDirection: 'row' },
    colHintCell: { borderRightWidth: 1.5, borderColor: '#333', justifyContent: 'flex-end', alignItems: 'center' },
    rowHintCell: { borderBottomWidth: 1.5, borderColor: '#333', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
    hintNumBox: { justifyContent: 'center', alignItems: 'center' },
    hintText: { fontWeight: 'bold', color: '#000' },
    cell: { borderWidth: 1.5, borderColor: '#333', backgroundColor: '#FFF' },
    boldRight: { borderRightWidth: 4, borderRightColor: '#000' },
    boldBottom: { borderBottomWidth: 4, borderBottomColor: '#000' },
    footer: { marginTop: 25, width: 600 },
    footerText: { fontSize: 14, color: '#444', fontStyle: 'italic', textAlign: 'center' },
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
    initialLoader: { marginTop: 100, alignItems: 'center' }
});

export default NonogramView;

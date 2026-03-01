import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView, TextInput, StatusBar } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { generateMaze, GeneratedMaze, MazeCell } from './GenerateMazeEngine';
import { log } from '../../utils/ConsoleLog';
import { PluginManager, PluginNoteAPI } from 'sn-plugin-lib';
import { GAMES_CONFIG } from '../../config/defaultSettings';
import pluginConfig from '../../PluginConfig.json';
import { getDirPath, saveObjectTo } from '../../utils/Storage';
import { useSettings } from '../../utils/SettingContext';
import { algorithms } from './algorithms';
import { SHAPE_SQUARE, EXITS_VERTICAL } from './constants';

interface GenerateMazeViewProps {
    onBack: () => void;
}

const GenerateMazeView = ({ onBack }: GenerateMazeViewProps) => {
    const { settings, updateSettings, isLoading } = useSettings();

    const [rows, setRows] = useState(30);
    const [cols, setCols] = useState(30);
    const [algorithm, setAlgorithm] = useState('recursiveBacktrack');
    const [mazeData, setMazeData] = useState<GeneratedMaze | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [hasInited, setHasInited] = useState(false);
    const viewRef = useRef<View>(null);

    // Lista algoritmi disponibili per la selezione
    const availableAlgorithms = Object.entries(algorithms).map(([id, alg]) => ({
        id,
        description: (alg as any).metadata.description
    })).filter(a => a.id !== 'none');

    useEffect(() => {
        if (!isLoading && settings?.GenerateMaze_DefaultSize && !hasInited) {
            setRows(settings.GenerateMaze_DefaultSize.rows);
            setCols(settings.GenerateMaze_DefaultSize.cols);
            setAlgorithm(settings.GenerateMaze_DefaultAlgorithm || 'recursiveBacktrack');
            handleGenerate(
                settings.GenerateMaze_DefaultSize.rows,
                settings.GenerateMaze_DefaultSize.cols,
                settings.GenerateMaze_DefaultAlgorithm || 'recursiveBacktrack'
            );
            setHasInited(true);
        }
    }, [isLoading, settings]);

    const handleGenerate = (r: number, c: number, alg: string) => {
        setIsGenerating(true);
        // Assicuriamoci che siano numeri
        const numRows = Math.max(5, Math.min(50, Number(r)));
        const numCols = Math.max(5, Math.min(50, Number(c)));

        setTimeout(() => {
            try {
                const maze = generateMaze(numCols, numRows, SHAPE_SQUARE, alg, EXITS_VERTICAL);
                setMazeData(maze);
                setRows(numRows);
                setCols(numCols);
                setAlgorithm(alg);

                updateSettings({
                    GenerateMaze_DefaultSize: { rows: numRows, cols: numCols },
                    GenerateMaze_DefaultAlgorithm: alg
                });
            } catch (e) {
                log("GenerateMaze", "Error: " + e);
            } finally {
                setIsGenerating(false);
            }
        }, 50);
    };

    const handleExport = async () => {
        if (!mazeData || !viewRef.current) return;
        setIsExporting(true);

        try {
            const base64Data = await captureRef(viewRef, {
                format: "png",
                result: "base64",
            });

            const dirPath = await getDirPath();
            const filePath = `${dirPath}/GenerateMaze.png`;
            saveObjectTo("base64", base64Data, filePath);

            await PluginNoteAPI.insertImage(filePath);
            PluginManager.closePluginView();
        } catch (e) {
            log("GenerateMaze", "Export Error: " + e);
        } finally {
            setIsExporting(false);
        }
    };

    const renderMaze = () => {
        if (!mazeData) return null;

        const cellSize = Math.min(500 / mazeData.width, 500 / mazeData.height, 20);
        const boardWidth = mazeData.width * cellSize;
        const boardHeight = mazeData.height * cellSize;

        const now = new Date();
        const dateStr = now.toLocaleDateString();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
            <View ref={viewRef} collapsable={false} style={styles.captureContainer}>
                <View style={styles.mazeHeader}>
                    <Text style={styles.title}>{GAMES_CONFIG.GenerateMaze.title}</Text>
                    <Text style={styles.mazeMeta}>
                        {mazeData.algorithm} - {mazeData.width}x{mazeData.height} - {dateStr} {timeStr}
                    </Text>
                </View>

                <View style={[styles.mazeBoard, { width: boardWidth, height: boardHeight }]}>
                    {mazeData.cells.map((cell: MazeCell, index: number) => {
                        const isNorthOpen = cell.links.includes('n') || cell.exitDir === 'n';
                        const isSouthOpen = cell.links.includes('s') || cell.exitDir === 's';
                        const isEastOpen = cell.links.includes('e') || cell.exitDir === 'e';
                        const isWestOpen = cell.links.includes('w') || cell.exitDir === 'w';

                        return (
                            <View
                                key={index}
                                style={[
                                    styles.cell,
                                    {
                                        left: cell.x * cellSize,
                                        top: cell.y * cellSize,
                                        width: cellSize,
                                        height: cellSize,
                                        borderTopWidth: isNorthOpen ? 0 : 2,
                                        borderBottomWidth: isSouthOpen ? 0 : 2,
                                        borderLeftWidth: isWestOpen ? 0 : 2,
                                        borderRightWidth: isEastOpen ? 0 : 2,
                                        borderColor: '#000',
                                    }
                                ]}
                            >
                                {cell.isStart && <Text style={[styles.marker, { fontSize: cellSize * 0.5 }]}>S</Text>}
                                {cell.isEnd && <Text style={[styles.marker, { fontSize: cellSize * 0.5 }]}>E</Text>}
                            </View>
                        );
                    })}
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

            <Text style={styles.title}>{GAMES_CONFIG.GenerateMaze.title}</Text>
            <Text style={styles.subtitle}>v{pluginConfig.versionName} by {pluginConfig.author}</Text>

            {isLoading ? (
                <View style={styles.initialLoader}>
                    <ActivityIndicator size="large" color="#000" />
                    <Text style={styles.loaderText}>Loading Settings...</Text>
                </View>
            ) : mazeData ? (
                <>
                    {renderMaze()}

                    <View style={styles.controls}>
                        <View style={styles.inputRow}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Rows:</Text>
                                <TextInput
                                    style={styles.input}
                                    value={rows.toString()}
                                    onChangeText={(t) => setRows(parseInt(t) || 0)}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Cols:</Text>
                                <TextInput
                                    style={styles.input}
                                    value={cols.toString()}
                                    onChangeText={(t) => setCols(parseInt(t) || 0)}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <Text style={styles.label}>Algorithm:</Text>
                        <View style={styles.algoGrid}>
                            {availableAlgorithms.map((alg) => (
                                <Pressable
                                    key={alg.id}
                                    style={[styles.algoBtn, algorithm === alg.id && styles.selectedAlgo]}
                                    onPress={() => setAlgorithm(alg.id)}
                                >
                                    <Text style={[styles.algoBtnText, algorithm === alg.id && styles.selectedAlgoText]}>
                                        {alg.description}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>

                        <Pressable
                            style={[styles.regenBtn, isGenerating && styles.disabledBtn]}
                            onPress={() => handleGenerate(rows, cols, algorithm)}
                            disabled={isGenerating}
                        >
                            <Text style={styles.regenBtnText}>REGENERATE MAZE</Text>
                        </Pressable>

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
                <ActivityIndicator size="large" color="#000" style={{ marginTop: 50 }} />
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
    captureContainer: { backgroundColor: '#FFF', padding: 20, alignItems: 'center' },
    mazeHeader: { marginBottom: 10, alignItems: 'center' },
    mazeMeta: { fontSize: 14, fontWeight: 'bold' },
    mazeBoard: { backgroundColor: '#FFF', position: 'relative' },
    cell: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
    marker: { fontWeight: '900', color: '#000' },
    controls: { marginTop: 30, alignItems: 'center', width: '100%', paddingHorizontal: 20 },
    inputRow: { flexDirection: 'row', gap: 20, marginBottom: 20 },
    inputGroup: { alignItems: 'center' },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 5 },
    input: { borderWidth: 2, borderColor: '#000', borderRadius: 8, padding: 8, width: 80, textAlign: 'center', fontSize: 18, fontWeight: 'bold' },
    algoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 },
    algoBtn: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 20 },
    selectedAlgo: { backgroundColor: '#000', borderColor: '#000' },
    algoBtnText: { fontSize: 12, color: '#666' },
    selectedAlgoText: { color: '#FFF' },
    regenBtn: { width: 300, paddingVertical: 15, borderWidth: 2, borderColor: '#000', borderRadius: 10, marginBottom: 15, alignItems: 'center' },
    regenBtnText: { fontWeight: 'bold' },
    exportBtn: { width: 300, height: 60, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
    exportBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
    disabledBtn: { backgroundColor: '#AAA', borderColor: '#AAA' },
    initialLoader: { marginTop: 50, alignItems: 'center', gap: 10 },
    loaderText: { fontWeight: 'bold' },
    backBtn: { marginTop: 40, padding: 10 },
    backBtnText: { textDecorationLine: 'underline', color: '#000' },
    closeButton: { position: 'absolute', top: 12, right: 12, padding: 10 },
    closeText: { fontSize: 20, fontWeight: 'bold' },
});

export default GenerateMazeView;

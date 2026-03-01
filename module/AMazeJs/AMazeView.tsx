// module/AMazeJs/AMazeView.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView, StatusBar, TextInput } from 'react-native';
import { useSettings } from '../../utils/SettingContext';
import { captureRef } from 'react-native-view-shot';
import { generateMaze, MazeData } from './AMazeEngine';
import { log } from '../../utils/ConsoleLog';
import { PluginManager, PluginNoteAPI } from 'sn-plugin-lib';
import { GAMES_CONFIG } from '../../config/defaultSettings';
import pluginConfig from '../../PluginConfig.json';
import { getDirPath, saveObjectTo } from '../../utils/Storage';

interface AMazeViewProps {
    onBack: () => void;
}

const AMazeView = ({ onBack }: AMazeViewProps) => {
    const { settings, updateSettings, isLoading } = useSettings();

    // Usiamo valori sicuri di fallback se i settings non sono ancora pronti o mancano
    const [rows, setRows] = useState(35);
    const [cols, setCols] = useState(35);
    const [mazeData, setMazeData] = useState<MazeData | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [hasInited, setHasInited] = useState(false);
    const viewRef = useRef<View>(null);

    // Sincronizziamo lo stato con i settings una volta caricati
    useEffect(() => {
        if (!isLoading && settings?.AMazeJs_DefaultSize && !hasInited) {
            setRows(settings.AMazeJs_DefaultSize.rows);
            setCols(settings.AMazeJs_DefaultSize.cols);
            handleGenerate(settings.AMazeJs_DefaultSize.rows, settings.AMazeJs_DefaultSize.cols);
            setHasInited(true);
        }
    }, [isLoading, settings]);

    const handleGenerate = (r: number, c: number) => {
        setIsGenerating(true);
        // Assicuriamoci che siano dispari e entro limiti ragionevoli
        const actualR = Math.max(5, r % 2 === 0 ? r + 1 : r);
        const actualC = Math.max(5, c % 2 === 0 ? c + 1 : c);

        log("AMazeJs", `Generating maze: ${actualR}x${actualC}`);

        // Salviamo nei settings
        updateSettings({ AMazeJs_DefaultSize: { rows: actualR, cols: actualC } });

        setTimeout(() => {
            try {
                const newMaze = generateMaze(actualR, actualC);
                setMazeData(newMaze);
                setRows(actualR);
                setCols(actualC);
            } catch (e) {
                log("AMazeJs", "Generation error: " + e);
            } finally {
                setIsGenerating(false);
            }
        }, 50);
    };

    const handleExport = async () => {
        if (!mazeData || !viewRef.current) return;
        setIsExporting(true);

        try {
            log("AMazeJs", "Exporting maze PNG...");
            const base64Data = await captureRef(viewRef, {
                format: "png",
                result: "base64",
            });

            const dirPath = await getDirPath();
            const filePath = `${dirPath}/Maze.png`;
            saveObjectTo("base64", base64Data, filePath);

            await PluginNoteAPI.insertImage(filePath);
            PluginManager.closePluginView();
        } catch (e) {
            log("AMazeJs", "Error: " + e);
        } finally {
            setIsExporting(false);
        }
    };

    const renderMaze = () => {
        if (!mazeData) return null;

        // Calcoliamo la dimensione della cella in base alla larghezza dello schermo (es. 500px)
        const cellSize = Math.floor(520 / mazeData.width);
        const now = new Date();
        const dateStr = now.toLocaleDateString();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
            <View ref={viewRef} collapsable={false} style={styles.captureContainer}>
                <View style={styles.row}>
                    <Text style={styles.title}>{GAMES_CONFIG.AMazeJs.title}</Text>
                </View>
                <View style={styles.gridHeader}>
                    <Text style={styles.headerText}>MAZE: {mazeData.width}x{mazeData.height}</Text>
                    <Text style={styles.headerText}>{dateStr} {timeStr}</Text>
                </View>
                <View style={[styles.mazeBoard, { width: cellSize * mazeData.width }]}>
                    {mazeData.grid.map((row, rIdx) => (
                        <View key={`row-${rIdx}`} style={styles.mazeRow}>
                            {row.map((cell, cIdx) => (
                                <View
                                    key={`cell-${rIdx}-${cIdx}`}
                                    style={[
                                        styles.mazeCell,
                                        {
                                            width: cellSize,
                                            height: cellSize,
                                            backgroundColor: cell ? '#FFF' : '#000'
                                        }
                                    ]}
                                />
                            ))}
                        </View>
                    ))}
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

            <Text style={styles.title}>{GAMES_CONFIG.AMazeJs.title}</Text>
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
                                    onChangeText={(val) => setRows(parseInt(val) || 0)}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Cols:</Text>
                                <TextInput
                                    style={styles.input}
                                    value={cols.toString()}
                                    onChangeText={(val) => setCols(parseInt(val) || 0)}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <Pressable
                            style={[styles.generateBtn, (isExporting || isGenerating) && styles.disabledBtn]}
                            onPress={() => handleGenerate(rows, cols)}
                            disabled={isExporting || isGenerating}
                        >
                            {isGenerating ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <Text style={styles.generateBtnText}>REGENERATE MAZE</Text>
                            )}
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
                <View style={styles.initialLoader}>
                    <ActivityIndicator size="large" color="#000" />
                    <Text style={styles.loaderText}>Generating amazing maze...</Text>
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
    gridHeader: { flexDirection: 'row', justifyContent: 'space-between', width: 540, marginBottom: 10 },
    headerText: { fontSize: 18, fontWeight: 'bold' },
    mazeBoard: { borderWidth: 2, borderColor: '#000' },
    mazeRow: { flexDirection: 'row' },
    mazeCell: {},
    row: { flexDirection: 'row' },
    controls: { marginTop: 30, alignItems: 'center', width: '100%' },
    inputRow: { flexDirection: 'row', gap: 30, marginBottom: 20 },
    inputGroup: { alignItems: 'center' },
    label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
    input: {
        width: 80,
        height: 50,
        borderWidth: 2,
        borderColor: '#000',
        borderRadius: 8,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        backgroundColor: '#FFF'
    },
    generateBtn: {
        width: 300,
        height: 60,
        borderWidth: 2,
        borderColor: '#000',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        backgroundColor: '#FFF'
    },
    generateBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
    exportBtn: { width: 300, height: 70, backgroundColor: '#000', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    exportBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
    disabledBtn: { backgroundColor: '#AAA', borderColor: '#AAA' },
    backBtn: { marginTop: 40, padding: 10 },
    backBtnText: { textDecorationLine: 'underline' },
    initialLoader: { marginTop: 100, alignItems: 'center', gap: 20 },
    loaderText: { fontSize: 14, fontWeight: 'bold' },
    closeButton: { position: 'absolute', top: 12, right: 12, paddingVertical: 6, paddingHorizontal: 10 },
    closeText: { fontSize: 18, fontWeight: '600' }
});

export default AMazeView;

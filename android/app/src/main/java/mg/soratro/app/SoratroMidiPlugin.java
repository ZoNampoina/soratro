package mg.soratro.app;

import android.content.Context;
import android.media.midi.MidiDevice;
import android.media.midi.MidiDeviceInfo;
import android.media.midi.MidiManager;
import android.media.midi.MidiOutputPort;
import android.media.midi.MidiReceiver;
import android.os.Handler;
import android.os.Looper;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.IOException;

/** Android MIDI services support USB OTG keyboards even where WebView lacks Web MIDI. */
@CapacitorPlugin(name = "SoratroMidi")
public class SoratroMidiPlugin extends Plugin {
    private MidiManager manager;
    private MidiDevice device;
    private MidiOutputPort output;
    private volatile boolean paused = false;
    private int generation = 0;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final MidiManager.DeviceCallback callback = new MidiManager.DeviceCallback() {
        @Override public void onDeviceAdded(MidiDeviceInfo info) { notifyListeners("devices", new JSObject()); }
        @Override public void onDeviceRemoved(MidiDeviceInfo info) {
            if (device != null && device.getInfo().getId() == info.getId()) closePort();
            notifyListeners("devices", new JSObject());
        }
    };
    @Override public void load() {
        manager = (MidiManager) getContext().getSystemService(Context.MIDI_SERVICE);
        if (manager != null) manager.registerDeviceCallback(callback, main);
    }
    @PluginMethod public void list(PluginCall call) {
        JSArray inputs = new JSArray();
        if (manager != null) for (MidiDeviceInfo info : manager.getDevices()) {
            for (MidiDeviceInfo.PortInfo port : info.getPorts()) if (port.getType() == MidiDeviceInfo.PortInfo.TYPE_OUTPUT) {
                JSObject input = new JSObject();
                String name = info.getProperties().getString(MidiDeviceInfo.PROPERTY_NAME, "Clavier MIDI USB");
                input.put("id", info.getId() + ":" + port.getPortNumber());
                input.put("name", name + (port.getName().isEmpty() ? "" : " · " + port.getName()));
                input.put("manufacturer", info.getProperties().getString(MidiDeviceInfo.PROPERTY_MANUFACTURER, ""));
                inputs.put(input);
            }
        }
        JSObject result = new JSObject(); result.put("inputs", inputs); call.resolve(result);
    }
    @PluginMethod public void open(PluginCall call) {
        String key = call.getString("id", "");
        if (manager == null) { call.reject("MIDI natif non disponible sur cet appareil."); return; }
        String[] parts = key.split(":");
        final int deviceId, portNumber;
        try { deviceId = Integer.parseInt(parts[0]); portNumber = Integer.parseInt(parts[1]); }
        catch (Exception e) { call.reject("Entrée MIDI invalide."); return; }
        MidiDeviceInfo found = null;
        for (MidiDeviceInfo info : manager.getDevices()) if (info.getId() == deviceId) { found = info; break; }
        if (found == null) { call.reject("Clavier MIDI déconnecté."); return; }
        closePort(); final int revision = generation;
        manager.openDevice(found, opened -> {
            if (opened == null) { call.reject("Impossible d’ouvrir le clavier MIDI."); return; }
            if (revision != generation) { try { opened.close(); } catch (IOException ignored) {} call.reject("Entrée MIDI modifiée."); return; }
            device = opened; output = opened.openOutputPort(portNumber);
            if (output == null) { closePort(); call.reject("Port MIDI non disponible."); return; }
            output.connect(new MidiReceiver() {
                @Override public void onSend(byte[] data, int offset, int count, long timestamp) {
                    if (paused || revision != generation) return;
                    JSArray bytes = new JSArray(); for (int i = offset; i < offset + count; i++) bytes.put(data[i] & 0xff);
                    JSObject packet = new JSObject(); packet.put("id", key); packet.put("bytes", bytes); packet.put("timestamp", Long.toString(timestamp));
                    notifyListeners("data", packet);
                }
            }); call.resolve();
        }, main);
    }
    private synchronized void closePort() {
        generation++;
        try { if (output != null) output.close(); } catch (IOException ignored) {}
        try { if (device != null) device.close(); } catch (IOException ignored) {}
        output = null; device = null;
    }
    @PluginMethod public void close(PluginCall call) { closePort(); call.resolve(); }
    @Override protected void handleOnPause() { paused = true; }
    @Override protected void handleOnResume() { paused = false; notifyListeners("devices", new JSObject()); }
    @Override protected void handleOnDestroy() { closePort(); if (manager != null) manager.unregisterDeviceCallback(callback); }
}

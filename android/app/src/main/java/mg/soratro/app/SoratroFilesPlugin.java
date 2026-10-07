package mg.soratro.app;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;
import android.print.PageRange;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintDocumentInfo;
import android.print.PrintManager;
import android.provider.OpenableColumns;
import android.util.Base64;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.FileOutputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Storage Access Framework: files remain usable outside SORATRO without broad storage permissions. */
@CapacitorPlugin(name = "SoratroFiles")
public class SoratroFilesPlugin extends Plugin {
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private Uri pendingUri;
    private static final int LIMIT = 32 * 1024 * 1024;

    @Override public void load() { acceptIntent(getActivity().getIntent()); }
    @Override protected void handleOnNewIntent(Intent intent) { acceptIntent(intent); }
    private synchronized void acceptIntent(Intent intent) {
        if (intent != null && Intent.ACTION_VIEW.equals(intent.getAction()) && intent.getData() != null) {
            pendingUri = intent.getData();
            notifyListeners("incoming", new JSObject(), true);
        }
    }
    private JSObject read(Uri uri) throws Exception {
        String name = "partition.soratro";
        try (Cursor cursor = getContext().getContentResolver().query(uri, null, null, null, null)) {
            if (cursor != null && cursor.moveToFirst()) {
                int index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (index >= 0) name = cursor.getString(index);
            }
        }
        try (InputStream input = getContext().getContentResolver().openInputStream(uri);
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            if (input == null) throw new Exception("Impossible d’ouvrir le fichier.");
            byte[] buffer = new byte[8192]; int count;
            while ((count = input.read(buffer)) != -1) {
                if (output.size() + count > LIMIT) throw new Exception("Fichier trop volumineux (32 Mo maximum).");
                output.write(buffer, 0, count);
            }
            JSObject result = new JSObject();
            result.put("name", name); result.put("text", output.toString("UTF-8")); return result;
        }
    }
    @PluginMethod public synchronized void consumePending(PluginCall call) {
        Uri uri = pendingUri; pendingUri = null;
        if (uri == null) { call.resolve(new JSObject()); return; }
        io.execute(() -> { try { call.resolve(read(uri)); } catch (Exception e) { call.reject(e.getMessage()); } });
    }
    @PluginMethod public void open(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE); intent.setType("*/*");
        startActivityForResult(call, intent, "opened");
    }
    @ActivityCallback private void opened(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
            call.reject("Ouverture annulée.", "CANCELLED"); return;
        }
        Uri uri = result.getData().getData();
        io.execute(() -> { try { call.resolve(read(uri)); } catch (Exception e) { call.reject(e.getMessage()); } });
    }
    @PluginMethod public void save(PluginCall call) {
        if (call.getString("base64") == null) { call.reject("Données de fichier absentes."); return; }
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(call.getString("mime", "application/octet-stream"));
        intent.putExtra(Intent.EXTRA_TITLE, call.getString("name", "partition.soratro"));
        startActivityForResult(call, intent, "saved");
    }
    @ActivityCallback private void saved(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
            call.reject("Enregistrement du fichier annulé.", "CANCELLED"); return;
        }
        Uri uri = result.getData().getData();
        io.execute(() -> {
            try (OutputStream output = getContext().getContentResolver().openOutputStream(uri, "wt")) {
                if (output == null) throw new Exception("Impossible d’écrire le fichier.");
                output.write(Base64.decode(call.getString("base64", ""), Base64.DEFAULT)); output.flush(); call.resolve();
            } catch (Exception e) { call.reject("Export impossible : " + e.getMessage()); }
        });
    }
    @PluginMethod public void print(PluginCall call) {
        final byte[] bytes;
        try { bytes = Base64.decode(call.getString("base64", ""), Base64.DEFAULT); }
        catch (Exception e) { call.reject("PDF invalide."); return; }
        if (bytes.length == 0) { call.reject("PDF vide."); return; }
        String name = call.getString("name", "SORATRO.pdf");
        getActivity().runOnUiThread(() -> {
            PrintManager manager = (PrintManager) getContext().getSystemService(Context.PRINT_SERVICE);
            manager.print(name, new PrintDocumentAdapter() {
                @Override public void onLayout(PrintAttributes oldAttributes, PrintAttributes attributes, CancellationSignal cancellation, LayoutResultCallback callback, android.os.Bundle extras) {
                    if (cancellation.isCanceled()) { callback.onLayoutCancelled(); return; }
                    callback.onLayoutFinished(new PrintDocumentInfo.Builder(name).setContentType(PrintDocumentInfo.CONTENT_TYPE_DOCUMENT).setPageCount(PrintDocumentInfo.PAGE_COUNT_UNKNOWN).build(), true);
                }
                @Override public void onWrite(PageRange[] pages, ParcelFileDescriptor destination, CancellationSignal cancellation, WriteResultCallback callback) {
                    io.execute(() -> {
                        if (cancellation.isCanceled()) { callback.onWriteCancelled(); return; }
                        try (FileOutputStream output = new FileOutputStream(destination.getFileDescriptor())) {
                            output.write(bytes); callback.onWriteFinished(new PageRange[]{PageRange.ALL_PAGES});
                        } catch (Exception e) { callback.onWriteFailed(e.getMessage()); }
                    });
                }
            }, null); call.resolve();
        });
    }
    @Override protected void handleOnDestroy() { io.shutdown(); }
}

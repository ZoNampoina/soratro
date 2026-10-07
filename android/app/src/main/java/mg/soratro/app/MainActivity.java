package mg.soratro.app;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SoratroFilesPlugin.class);
        registerPlugin(SoratroMidiPlugin.class);
        super.onCreate(savedInstanceState);
    }
}

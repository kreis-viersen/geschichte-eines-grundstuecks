# Die Geschichte eines Grundstücks

*Karten, Luftbilder und Katasterinformationen im Wandel der Zeit*

https://kreis-viersen.usercontent.opencode.de/geschichte-eines-grundstuecks

"Die Geschichte eines Grundstücks" ist eine browserbasierte Kartenanwendung für Nordrhein-Westfalen. Nach der Auswahl eines Punktes stellt sie verfügbare Luftbilder, historische Karten und Katasterinformationen zusammen. Die Ergebnisse können als mehrseitige PDF ausgegeben und im erweiterten Modus für QGIS oder als Permalink weitergegeben werden.

## Funktionen

- Auswahl eines Punktes innerhalb Nordrhein-Westfalens
- Adresssuche mit Photon auf Basis von OpenStreetMap
- Abfrage historischer und aktueller Luftbilder von Geobasis NRW
- Einbindung historischer Kartenwerke, Basiskarten und Flurkarten
- einfache automatische PDF-Erstellung
- erweiterte Auswahl, Sortierung und Darstellung der Themen
- PDF-Export im Format A4 quer mit Maßstabsbalken
- QGIS-Export als Layerdefinition (`.qlr`)
- Permalink für Kartenansicht, Auswahlpunkt und Layerzustand
- zusätzliche Informationen und Karten für Punkte im Kreis Viersen

Die Anwendung benötigt eine Internetverbindung, da die Karten und Luftbilder zur Laufzeit über externe Dienste geladen werden.

## Bedienung

### Einfacher Modus

Der einfache Modus erzeugt automatisch eine passende Zusammenstellung für den gewählten Punkt.

1. Eine Adresse suchen oder die Karte verschieben und zoomen.
2. Innerhalb der NRW-Grenze auf den gewünschten Punkt klicken.
3. Warten, bis die verfügbaren Luftbilder und Karten ermittelt wurden.
4. Festlegen, ob der Auswahlpunkt in der PDF eingezeichnet werden soll.
5. **PDF erstellen** wählen.

Für die Kartenwerke verwendet der einfache Modus vordefinierte Zielmaßstäbe. Die Ausschnitte werden um den Auswahlpunkt zentriert.

Im Dialog werden außerdem zwei teilbare Links angeboten:

- **Mit Dialog** öffnet die Anwendung am gewählten Punkt und zeigt den PDF-Dialog.
- **Direkter PDF-Export** startet nach dem Öffnen automatisch die Ermittlung und Erstellung der PDF.

### Erweiterter Modus

Der erweiterte Modus bietet die vollständige Kontrolle über Auswahl, Reihenfolge und Darstellung der Themen.

1. Auf **Erweitert** wechseln.
2. Eine Adresse suchen oder die Karte verschieben und zoomen.
3. Den gewünschten Punkt innerhalb Nordrhein-Westfalens anklicken.
4. Luftbilder auswählen und bei Bedarf nach Datum sortieren.
5. Optional Luftbild-Metadatenlayer und weitere Karten aktivieren.
6. **Auswahl anzeigen** wählen.

In der Liste **Geladene Luftbilder und Karten** können die Themen anschließend bearbeitet werden:

- ein- und ausblenden
- Deckkraft ändern
- Reihenfolge ändern
- einzelne Themen entfernen
- alle Themen entfernen

Ein grau dargestelltes Thema ist beim aktuellen Zoom möglicherweise außerhalb seines vorgesehenen Darstellungsbereichs, bleibt aber geladen.

## Verfügbare Inhalte

Die tatsächlich angebotenen Inhalte hängen vom Auswahlpunkt, von der regionalen Abdeckung und teilweise vom aktuellen Zoom ab.

### Luftbilder

- historische Digitale Orthophotos (DOP)
- historische InVeKoS Digitale Orthophotos (iDOP)
- aktuelle Digitale Orthophotos (DOP)
- aktuelle InVeKoS Orthophotos (iDOP)
- vorläufige Digitale Orthophotos (vDOP)

### Karten und Katasterinformationen

- Tranchot / von Müffling
- Preußische Uraufnahme
- Preußische Neuaufnahme
- Topographische Karte 1:25.000, Fortführungsstände 1936–1945
- Deutsche Grundkarte 1:5.000
- Amtliche Basiskarte NRW
- Flurkarte NRW aus ALKIS
- Flurkarte Kreis Viersen
- historische Fluren im Kreis Viersen

Kreis-Viersen-spezifische Themen werden nur angeboten, wenn der Auswahlpunkt innerhalb des Kreisgebiets liegt. Außerhalb des Kreises Viersen wird anstelle der lokalen Flurkarte die landesweite Flurkarte NRW angeboten.

## PDF-Export

Die PDF wird im Format A4 quer erzeugt. Sie enthält grundsätzlich:

1. ein Titelblatt mit Übersichtskarte und Auswahlpunkt
2. die Koordinaten des Auswahlpunkts in WGS 84 (`EPSG:4326`)
3. die Koordinaten als Rechtswert und Hochwert in ETRS89 / UTM Zone 32N (`EPSG:25832`)
4. ein klickbares Inhaltsverzeichnis
5. eine eigene OpenStreetMap-Seite
6. eine Seite je ausgewähltem Luftbild oder Kartenwerk
7. eine Seite mit Datenquellen und weiterführenden Informationen

Jede Karten- und Luftbildseite enthält einen grafischen Maßstabsbalken. Über den Link **Inhalt** kann zum Inhaltsverzeichnis zurückgesprungen werden.

### Auswahlpunkt und Beschriftung

Der rote Auswahlpunkt kann im PDF-Dialog ein- oder ausgeschaltet werden. Bei Luftbildern wird mit eingezeichnetem Auswahlpunkt das vollständige Bildflugdatum angegeben; ohne Punkt wird nur das Jahr verwendet.

### Maßstäbe im erweiterten Modus

Im erweiterten Modus stehen zwei Varianten zur Verfügung:

- **Wie in der Kartenansicht:** Die PDF verwendet den sichtbaren A4-Ausschnitt der Webkarte.
- **Empfohlene Maßstäbe verwenden:** OSM und Kartenwerke werden mit den Zielmaßstäben des einfachen Modus um den Auswahlpunkt zentriert. Luftbilder behalten weiterhin den sichtbaren A4-Ausschnitt.

### Zusätzliche Seiten für den Kreis Viersen

Liegt der Auswahlpunkt im Kreis Viersen, ergänzt die Anwendung weitere Seiten mit:

- Download- und Findehilfen für historische Karten
- Metadatenlinks im Geodatenkatalog Niederrhein
- Zeitstrahl der Kartenwerke im Liegenschaftskataster
- Übersicht der Urgemarkungen
- Kontaktinformationen des Amts für Kataster und Geoinformation
- Link zur historischen Rückverfolgung

## QGIS-Export

Der Export **Für QGIS herunterladen (.qlr)** steht im erweiterten Modus zur Verfügung.

Die QLR-Datei enthält:

- alle geladenen WMS-Themen
- die aktuelle Layerreihenfolge
- Sichtbarkeit und Deckkraft der Themen
- den Auswahlpunkt als eigenen roten Punktlayer
- eine gemeinsame Layergruppe mit Rechtswert und Hochwert im Gruppennamen
- einheitlich `EPSG:25832` für WMS-Layer und Auswahlpunkt

Die QLR enthält keine Kopie der Geodaten. Beim Öffnen in QGIS werden die jeweiligen WMS-Dienste erneut über das Internet angesprochen.

Zum Laden in QGIS kann die `.qlr`-Datei in ein geöffnetes Projekt gezogen oder über die QGIS-Funktion zum Hinzufügen einer Layerdefinition geladen werden.

## Permalink im erweiterten Modus

Mit **Permalink kopieren** wird der aktuelle Zustand der erweiterten Ansicht in einer URL gespeichert. Der Link enthält:

- Kartenmittelpunkt und Zoom
- Auswahlpunkt
- geladene Themen
- Reihenfolge der Themen
- Sichtbarkeit und Deckkraft

Beim Öffnen eines Links mit `point=` startet die Anwendung automatisch im erweiterten Modus.

Die Reihenfolge der Einträge im Parameter `layers=` entspricht der Layerreihenfolge. Ohne Zusatz gilt eine Deckkraft von 100 Prozent. Abweichende Werte werden mit einem Unterstrich angehängt, zum Beispiel:

```text
abk_0.5
```

Das entspricht 50 Prozent Deckkraft. Ein Wert von `_0` bedeutet geladen, aber ausgeblendet.

## Lokale Entwicklung

### Voraussetzungen

- Node.js `^20.19.0` oder `>=22.12.0`
- npm

### Installation

```bash
npm ci
```

### Entwicklungsserver starten

```bash
npm run dev
```

Vite zeigt anschließend die lokale Adresse im Terminal an.

### Syntax prüfen

```bash
npm run check
```

### Produktions-Build erzeugen

```bash
npm run build
```

Der fertige statische Build wird im Verzeichnis `dist/` abgelegt.

### Produktions-Build lokal testen

```bash
npm run preview
```

## Bereitstellung

Die Anwendung ist ein statischer Vite-Build und benötigt serverseitig keine Anwendungslogik. Das Verzeichnis `dist/` kann auf einem gewöhnlichen Webserver oder über einen Pages-Dienst veröffentlicht werden.

Die Asset-Pfade sind relativ konfiguriert. Dadurch kann die Anwendung auch in einem Unterverzeichnis bereitgestellt werden.

Für GitLab Pages ist eine CI-Konfiguration enthalten. Sie führt auf dem Standard-Branch `npm ci` und `npm run build` aus und veröffentlicht anschließend `dist/`.


## Hinweise zu externen Diensten

Die Anwendung greift direkt auf externe WMS- und Suchdienste zu. Einzelne Inhalte können deshalb vorübergehend nicht erreichbar sein oder wegen regionaler Abdeckung beziehungsweise Zoomgrenzen nicht angezeigt werden. Nicht erfolgreiche Abfragen werden in der Oberfläche gemeldet; bei der PDF-Erstellung kann eine betroffene Seite einen Fehlerhinweis enthalten, während die übrigen Seiten weiter erzeugt werden.

## Lizenz und Datenquellen

Der Quellcode steht unter der Lizenz **GPL-3.0-or-later**. Der vollständige Lizenztext liegt in der Datei [`LICENSE`](LICENSE).

Die eingebundenen Geodaten unterliegen den jeweils angegebenen Nutzungsbedingungen. In der Anwendung und in den erzeugten PDF-Dateien werden die zugehörigen Quellen- und Lizenzhinweise ausgegeben. Die OpenStreetMap-Hintergrundkarte wird mit der Attribution **© OpenStreetMap-Mitwirkende · ODbL** verwendet.

## Kontakt

Fragen, Anmerkungen und Fehlermeldungen können per E-Mail an [open@kreis-viersen.de](mailto:open@kreis-viersen.de) gesendet werden.

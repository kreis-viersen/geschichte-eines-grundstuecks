/**
 * Projektweit freigegebene, einfache SPDX-Lizenzkennungen.
 *
 * Die Prüfung ist absichtlich restriktiv:
 * - unbekannte Kennungen scheitern,
 * - fehlende Kennungen scheitern,
 * - zusammengesetzte Ausdrücke mit AND, OR oder WITH scheitern,
 *   solange sie nicht nach manueller Prüfung ausdrücklich freigegeben wurden.
 */
export const acceptedLicenseIdentifiers = new Set([
  '0BSD',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'ISC',
  'MIT',
  'Unlicense',
  'Zlib'
]);

/**
 * Manuell geprüfte, exakt freigegebene SPDX-Ausdrücke.
 *
 * Keine Teilstring- oder RegExp-Freigaben verwenden: Ein veränderter Ausdruck
 * soll nach einem Paketupdate erneut bewusst geprüft werden.
 */
export const acceptedLicenseExpressions = new Set([
  // pako: MIT für den überwiegenden Teil, Zlib für den eingebundenen zlib-Port.
  '(MIT AND Zlib)',

  // DOMPurify ist dual lizenziert; für dieses Projekt wird Apache-2.0 gewählt.
  // Der Originalausdruck bleibt aus Transparenzgründen erhalten.
  '(MPL-2.0 OR Apache-2.0)'
]);

// Nur verwenden, wenn eine konkrete Paketversion ausdrücklich eine Lizenzwahl
// anbietet oder die gemeldete Lizenzangabe nachweislich falsch bzw. unvollständig
// ist. Schlüssel immer mit exakter Version angeben.
export const licenseOverrides = {
  // rgbcolor bietet ausdrücklich MIT ODER die alternative FEEL-FREE-Lizenz an.
  // Für diese konkrete Paketversion wird bewusst die MIT-Option gewählt.
  'rgbcolor@1.0.1': 'MIT'
};

export function isUnacceptableLicense(licenseIdentifier) {
  if (typeof licenseIdentifier !== 'string') return true;

  const normalized = licenseIdentifier.trim();
  if (normalized.length === 0) return true;

  return !acceptedLicenseIdentifiers.has(normalized)
    && !acceptedLicenseExpressions.has(normalized);
}

export function formatThirdPartyNotices(packages) {
  const sorted = [...packages].sort((first, second) =>
    first.name.localeCompare(second.name, 'en') || first.version.localeCompare(second.version, 'en')
  );

  const sections = sorted.map(pkg => {
    const repository = pkg.repository ? `\nRepository: ${pkg.repository}` : '';
    const source = pkg.source ? `\nQuelle: ${pkg.source}` : '';
    const author = pkg.author ? `\nUrheber/Autor: ${pkg.author}` : '';
    const licenseText = pkg.licenseText?.trim() || 'Kein Lizenztext im Paket gefunden.';

    return `## ${pkg.name} ${pkg.version}\n\nLizenz: ${pkg.license}${author}${repository}${source}\n\n\`\`\`text\n${licenseText}\n\`\`\``;
  });

  return `# Drittanbieter-Lizenzen\n\nDiese Datei wird beim Produktionsbuild automatisch aus den tatsächlich gebündelten npm-Paketen erzeugt.\n\n${sections.join('\n\n---\n\n')}\n`;
}

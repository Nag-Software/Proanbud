import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import React from 'react';

export function PilotavtalePdfDocument({ form }: { form: any }) {
  return (
    <Document>
      <Page size="A4" style={styles.pageBg}>
        <View style={styles.outerMargin}>
          <View style={styles.container}>
            <Image src="/assets/template-logo.png" style={styles.logo} />
            <Text style={styles.title}>Pilotavtale</Text>
            {/* PARTENE */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>PARTENE</Text>
              <View style={styles.sectionList}>
                <Text>
                  <Text style={styles.bold}>Leverandør:</Text> Proanbud AS (org.nr ...)
                </Text>
                <Text>
                  <Text style={styles.bold}>Kunde:</Text> {form.kundenavn || ' '}
                </Text>
              </View>
            </View>
            {/* FORMÅL */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>FORMÅL</Text>
              <Text style={styles.sectionText}>
                Gjennomføre pilot av Proanbud AI‑tilbudstjeneste for å evaluere funksjonalitet, brukervennlighet og verdi for kunde.
              </Text>
            </View>
            {/* VARIGHET */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>VARIGHET</Text>
              <Text style={styles.sectionText}>
                Avtalen gjelder i 3 måneder fra signering. Forlengelse kan avtales skriftlig.
              </Text>
            </View>
            {/* PRIS OG VILKÅR */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>PRIS OG VILKÅR</Text>
              <Text style={styles.sectionText}>
                99 kr/måned for å dekke AI- og serverkostnader. Forutsetter aktiv bruk, løpende tilbakemeldinger og deltakelse i anonymisert case study. Fakturering skjer månedlig.
              </Text>
            </View>
            {/* ANSVAR OG DATABEHANDLING */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ANSVAR OG DATABEHANDLING</Text>
              <Text style={styles.sectionText}>
                Proanbud behandler data i henhold til gjeldende personvernpolicy og GDPR. All data lagres sikkert og brukes kun til formål knyttet til tjenesten. Kunden har rett til innsyn og sletting av egne data.
              </Text>
            </View>
            {/* IMMATERIELLE RETTIGHETER */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>IMMATERIELLE RETTIGHETER</Text>
              <Text style={styles.sectionText}>
                Proanbud eier all teknologi og programvare utviklet i prosjektet. Kunden eier og har full råderett over egne data og innhold.
              </Text>
            </View>
            {/* OPPSIGELSE */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>OPPSIGELSE</Text>
              <Text style={styles.sectionText}>
                Avtalen kan sies opp med 14 dagers skriftlig varsel fra begge parter. Ved oppsigelse slettes kundens data etter ønske.
              </Text>
            </View>
            {/* MARKEDSFØRING */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>MARKEDSFØRING</Text>
              <Text style={styles.sectionText}>
                Proanbud kan bruke anonymiserte resultater og erfaringer fra piloten i markedsføring og videre produktutvikling, etter avtale med kunde.
              </Text>
            </View>
            {/* SIGNATURRAD */}
            <View style={styles.signatureRow}>
              <View style={styles.signatureBlock}>
                <Text style={styles.signatureLabel}>For Proanbud AS</Text>
                <Text style={styles.signatureInput}>{form.proanbudNavn}</Text>
                {form.proanbudSign && <Image src={form.proanbudSign} style={styles.signatureImg} />}
              </View>
              <View style={styles.signatureBlock}>
                <Text style={styles.signatureLabel}>For kunde</Text>
                <Text style={styles.signatureInput}>{form.kundeNavn}</Text>
                {form.kundeSign && <Image src={form.kundeSign} style={styles.signatureImg} />}
                <Text style={styles.signatureDate}>{form.kundeDato}</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

const styles = StyleSheet.create({
  pageBg: {
    backgroundColor: '#f8fafc',
    width: '100%',
    height: '100%',
  },
  outerMargin: {
    padding: 20,
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    border: '1px solid #e5e7eb',
    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
    padding: 32,
    fontSize: 14,
    fontFamily: 'Helvetica',
    width: 768,
    minHeight: 680,
    display: 'flex',
    flexDirection: 'column',
    margin: '0 auto',
  },
  sectionLabel: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Helvetica',
  },
  sectionList: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 2,
    marginBottom: 8,
  },
  bold: {
    fontWeight: 'bold',
  },
  sectionText: {
    fontSize: 16,
    color: '#222',
    marginTop: 2,
    fontFamily: 'Helvetica',
  },
  logo: {
    width: 200,
    marginBottom: 24,
    alignSelf: 'center',
  },
  title: {
    fontSize: 30,
    textAlign: 'center',
    marginBottom: 32,
    color: '#0b5fff',
    fontWeight: 'bold',
    fontFamily: 'Helvetica',
  },
  section: {
    marginBottom: 28,
    paddingBottom: 20,
    borderBottom: '1px solid #e5e7eb',
  },
  signatureRow: {
    flexDirection: 'row',
    gap: 32,
    marginTop: 40,
    borderTop: '1px solid #e5e7eb',
    paddingTop: 32,
    justifyContent: 'space-between',
  },
  signatureBlock: {
    flex: 1,
    flexDirection: 'column',
    gap: 8,
    alignItems: 'flex-start',
    marginRight: 16,
  },
  signatureLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Helvetica',
  },
  signatureInput: {
    borderBottom: '1px solid #d1d5db',
    paddingHorizontal: 4,
    backgroundColor: 'transparent',
    fontSize: 14,
    minWidth: 120,
    minHeight: 16,
    fontFamily: 'Helvetica',
  },
  signatureImg: {
    width: 120,
    height: 40,
    marginBottom: 4,
  },
  signatureDate: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Helvetica',
  },
});
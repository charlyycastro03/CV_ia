import React from 'react'
import { Document, Page, Text, View, StyleSheet, renderToStream } from '@react-pdf/renderer'

// Estilos básicos para el PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.4,
    color: '#333'
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#000'
  },
  contact: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
    paddingBottom: 3
  },
  job: {
    marginBottom: 10,
  },
  jobTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111'
  },
  jobMeta: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#555',
    marginBottom: 4
  },
  bullet: {
    flexDirection: 'row',
    marginBottom: 3
  },
  bulletPoint: {
    width: 10,
    fontSize: 10
  },
  bulletText: {
    flex: 1,
  },
  text: {
    marginBottom: 5
  }
})

// Componente React PDF
const CVDocument = ({ cvData }: { cvData: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.name}>{cvData.name || 'Candidato'}</Text>
        <Text style={styles.contact}>{cvData.email || ''}</Text>
        <Text style={styles.contact}>{cvData.location || ''}</Text>
        {cvData.phone && <Text style={styles.contact}>{cvData.phone}</Text>}
      </View>

      {cvData.summary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Perfil Profesional</Text>
          <Text style={styles.text}>{cvData.summary}</Text>
        </View>
      )}

      {cvData.experience && cvData.experience.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experiencia</Text>
          {cvData.experience.map((exp: any, i: number) => (
            <View key={i} style={styles.job}>
              <Text style={styles.jobTitle}>{exp.title}</Text>
              <Text style={styles.jobMeta}>{exp.company} | {exp.dates}</Text>
              {exp.description && <Text style={styles.text}>{exp.description}</Text>}
              {exp.highlights && exp.highlights.map((h: string, j: number) => (
                <View key={j} style={styles.bullet}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.bulletText}>{h}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      )}

      {cvData.skills && cvData.skills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Habilidades</Text>
          <Text style={styles.text}>{cvData.skills.join(' • ')}</Text>
        </View>
      )}
      
      {cvData.education && cvData.education.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Educación</Text>
          {cvData.education.map((edu: any, i: number) => (
            <View key={i} style={styles.job}>
              <Text style={styles.jobTitle}>{edu.degree}</Text>
              <Text style={styles.jobMeta}>{edu.institution} | {edu.dates}</Text>
            </View>
          ))}
        </View>
      )}
    </Page>
  </Document>
)

export async function generateCVPdf(cvData: any): Promise<Buffer> {
  const stream = await renderToStream(<CVDocument cvData={cvData} />)
  
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    stream.on('error', (err) => reject(err))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
  })
}

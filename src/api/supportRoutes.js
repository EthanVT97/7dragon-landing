import express from 'express'
import { supabase } from '../supabase'
import { PDFDocument, rgb } from 'pdf-lib'
import { format } from 'date-fns'

const router = express.Router()

// Check support availability
router.get('/status', async (req, res) => {
  try {
    // Get online support staff count
    const { data, error } = await supabase
      .from('support_staff')
      .select('id')
      .eq('status', 'online')

    if (error) throw error

    // Consider support online if at least one staff member is available
    const isOnline = data.length > 0

    res.json({
      online: isOnline,
      staffCount: data.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error checking support status:', error)
    res.status(500).json({ error: 'Failed to check support status' })
  }
})

// Handle emergency support requests
router.post('/emergency', async (req, res) => {
  const { sessionId, type = 'urgent' } = req.body

  try {
    // Create support alert
    const { data, error } = await supabase
      .from('support_alerts')
      .insert({
        session_id: sessionId,
        type,
        status: 'pending',
        priority: 'high',
        created_at: new Date().toISOString()
      })
      .select()

    if (error) throw error

    // Notify available support staff (implement your notification system here)
    
    res.json({
      success: true,
      alertId: data[0].id,
      message: 'Emergency support request received'
    })
  } catch (error) {
    console.error('Error creating emergency support request:', error)
    res.status(500).json({ error: 'Failed to create emergency support request' })
  }
})

// Export chat transcript
router.post('/export/:format', async (req, res) => {
  const { sessionId, messages } = req.body
  const format = req.params.format.toLowerCase()

  try {
    if (format === 'pdf') {
      // Create PDF document
      const pdfDoc = await PDFDocument.create()
      const page = pdfDoc.addPage()
      const { height, width } = page.getSize()
      
      // Add chat transcript header
      page.drawText('Chat Transcript', {
        x: 50,
        y: height - 50,
        size: 20,
        color: rgb(0, 0, 0)
      })

      // Add timestamp
      page.drawText(`Generated: ${format(new Date(), 'PPpp')}`, {
        x: 50,
        y: height - 80,
        size: 12,
        color: rgb(0.4, 0.4, 0.4)
      })

      // Add messages
      let yPosition = height - 120
      for (const message of messages) {
        const timestamp = format(new Date(message.created_at), 'pp')
        const sender = message.sender_type === 'user' ? 'You' : 'Support'
        
        page.drawText(`${sender} (${timestamp}):`, {
          x: 50,
          y: yPosition,
          size: 10,
          color: rgb(0.4, 0.4, 0.4)
        })

        page.drawText(message.content, {
          x: 50,
          y: yPosition - 20,
          size: 12,
          color: rgb(0, 0, 0),
          maxWidth: width - 100
        })

        yPosition -= 60

        // Add new page if needed
        if (yPosition < 50) {
          page = pdfDoc.addPage()
          yPosition = height - 50
        }
      }

      const pdfBytes = await pdfDoc.save()
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename=chat-transcript-${sessionId}.pdf`)
      res.send(Buffer.from(pdfBytes))
    } else {
      // Export as text
      let textContent = `Chat Transcript\n`
      textContent += `Generated: ${format(new Date(), 'PPpp')}\n\n`

      for (const message of messages) {
        const timestamp = format(new Date(message.created_at), 'pp')
        const sender = message.sender_type === 'user' ? 'You' : 'Support'
        textContent += `${sender} (${timestamp}):\n${message.content}\n\n`
      }

      res.setHeader('Content-Type', 'text/plain')
      res.setHeader('Content-Disposition', `attachment; filename=chat-transcript-${sessionId}.txt`)
      res.send(textContent)
    }
  } catch (error) {
    console.error('Error exporting chat transcript:', error)
    res.status(500).json({ error: 'Failed to export chat transcript' })
  }
})

export default router

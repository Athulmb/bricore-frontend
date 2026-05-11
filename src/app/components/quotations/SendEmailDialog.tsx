import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Mail, Send, Loader2 } from 'lucide-react';
import { useSendQuotationEmail } from '../../hooks/useQuotations';

interface SendEmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: any;
  clientEmail?: string;
  onSuccess?: () => void;
}

export function SendEmailDialog({ isOpen, onClose, quotation, clientEmail, onSuccess }: SendEmailDialogProps) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const sendEmailMutation = useSendQuotationEmail();

  useEffect(() => {
    if (quotation) {
      setTo(clientEmail || '');
      setSubject(quotation.subject || `Quotation ${quotation.quotationNo} from Global Mineral Exports`);
      setBody(`Dear ${quotation.customerName || quotation.client},\n\nPlease find attached the quotation ${quotation.quotationNo} as requested.\n\nBest regards,\nGlobal Mineral Exports Team`);
    }
  }, [quotation, clientEmail, isOpen]);

  const handleSend = async () => {
    if (!to) return;
    
    try {
      await sendEmailMutation.mutateAsync({
        id: quotation.id || quotation._id,
        customTo: to,
        customSubject: subject,
        customBody: body
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-[#203727]" />
            Send Quotation via Email
          </DialogTitle>
          <DialogDescription>
            Review and customize the email details before sending.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              placeholder="client@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Email Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="body">Message Body</Label>
            <Textarea
              id="body"
              placeholder="Type your message here..."
              className="min-h-[150px]"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
          <div className="p-3 bg-slate-50 rounded-md border border-slate-200 flex items-center gap-3">
            <div className="bg-[#203727]/10 p-2 rounded">
              <Mail className="h-4 w-4 text-[#203727]" />
            </div>
            <div className="text-xs">
              <p className="font-bold text-gray-700">Attachment Included</p>
              <p className="text-gray-500">Quotation_{quotation?.quotationNo || 'PDF'}.pdf</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSend} 
            disabled={sendEmailMutation.isPending || !to}
            className="bg-[#203727] hover:bg-[#2d4d39] gap-2"
          >
            {sendEmailMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

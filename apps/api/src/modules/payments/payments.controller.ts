import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Can } from '../../core/rbac';
import { PaymentsService } from './payments.service';
import { CreateInvoiceDto, RecordPaymentDto } from './dto/payments.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get('bookings/:bookingId/invoices')
  @Can('invoice.read_own')
  invoices(@Param('bookingId') bookingId: string) {
    return this.payments.listInvoices(bookingId);
  }

  @Post('bookings/:bookingId/invoices')
  @Can('invoice.create')
  createInvoice(@Param('bookingId') bookingId: string, @Body() dto: CreateInvoiceDto) {
    return this.payments.createInvoice(bookingId, dto);
  }

  @Get('bookings/:bookingId/payments')
  @Can('payment.read_own')
  list(@Param('bookingId') bookingId: string) {
    return this.payments.listPayments(bookingId);
  }

  @Post('bookings/:bookingId/payments')
  @Can('payment.create')
  record(@Param('bookingId') bookingId: string, @Body() dto: RecordPaymentDto) {
    return this.payments.recordPayment(bookingId, dto);
  }

  @Post('bookings/:bookingId/payments/gateway-order')
  @Can('payment.create')
  gatewayOrder(@Param('bookingId') bookingId: string, @Body() dto: RecordPaymentDto) {
    return this.payments.createGatewayOrder(bookingId, dto);
  }

  @Post('payments/:id/refund')
  @Can('payment.manage')
  refund(@Param('id') id: string) {
    return this.payments.refund(id);
  }
}

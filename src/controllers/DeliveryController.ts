import { prisma } from '../lib/prisma';

export class DeliveryController {
  async index(req: any, res: any) {
    try {
      const deliveries = await prisma.delivery.findMany({
        include: {
          driver: true,
          vehicle: true,
        },
      });
      return res.json(deliveries);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao listar entregas.' });
    }
  }

  async show(req: any, res: any) {
    try {
      const { id } = req.params;
      const delivery = await prisma.delivery.findUnique({
        where: { id },
        include: {
          driver: true,
          vehicle: true,
        },
      });
      if (!delivery) {
        return res.status(404).json({ error: 'Entrega não encontrada.' });
      }
      return res.json(delivery);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar entrega.' });
    }
  }

  async create(req: any, res: any) {
    try {
      // Pegamos todos os campos que o banco de dados exige
      const { 
        description, 
        pickupAddress, 
        deliveryAddress, 
        price, 
        driverId, 
        vehicleId 
      } = req.body;
      
      const delivery = await prisma.delivery.create({
        data: { 
          description,
          status: 'PENDING',
          // Valores padrão caso o front-end ainda não tenha os inputs:
          pickupAddress: pickupAddress || 'Endereço Central LogiTrack',
          deliveryAddress: deliveryAddress || 'Endereço do Cliente',
          price: price ? Number(price) : 25.50,
          
          // O seu Prisma exige que a entrega seja criada JÁ COM motorista e veículo.
          // Atenção: O Front-end TEM que mandar esses IDs agora, senão o Prisma recusa!
          driverId: driverId,
          vehicleId: vehicleId
        },
        include: {
          driver: true,
          vehicle: true,
        },
      });
      
      return res.status(201).json(delivery);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao criar entrega. Verifique se enviou DriverId e VehicleId.' });
    }
  }

  async update(req: any, res: any) {
    try {
      const { id } = req.params;
      const { description, status, driverId, vehicleId } = req.body;

      const delivery = await prisma.delivery.update({
        where: { id },
        data: {
          ...(description && { description }),
          ...(status && { status }),
          ...(driverId && { driverId }),
          ...(vehicleId && { vehicleId }),
        },
        include: {
          driver: true,
          vehicle: true,
        },
      });

      return res.json(delivery);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar entrega.' });
    }
  }

  async updateStatus(req: any, res: any) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['PENDING', 'IN_TRANSIT', 'DELIVERED'].includes(status)) {
        return res.status(400).json({ error: 'Status inválido.' });
      }

      const delivery = await prisma.delivery.update({
        where: { id },
        data: { status },
        include: {
          driver: true,
          vehicle: true,
        },
      });

      return res.json(delivery);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar status da entrega.' });
    }
  }

  async delete(req: any, res: any) {
    try {
      const { id } = req.params;

      await prisma.delivery.delete({
        where: { id },
      });

      return res.status(204).send();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao deletar entrega.' });
    }
  }
}
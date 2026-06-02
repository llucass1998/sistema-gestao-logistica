import { prisma } from '../lib/prisma';

export class VehicleController {
  async index(req: any, res: any) {
    try {
      const vehicles = await prisma.vehicle.findMany();
      return res.json(vehicles);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao listar veículos.' });
    }
  }

  async show(req: any, res: any) {
    try {
      const { id } = req.params;
      const vehicle = await prisma.vehicle.findUnique({
        where: { id },
      });
      if (!vehicle) {
        return res.status(404).json({ error: 'Veículo não encontrado.' });
      }
      return res.json(vehicle);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar veículo.' });
    }
  }

  async create(req: any, res: any) {
    try {
      const { model, plate, capacity } = req.body;

      const vehicle = await prisma.vehicle.create({
        data: {
          model,
          plate,
          capacity: capacity ? Number(capacity) : 500.0,
        },
      });

      return res.status(201).json(vehicle);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao cadastrar veículo.' });
    }
  }

  async update(req: any, res: any) {
    try {
      const { id } = req.params;
      const { model, plate, capacity } = req.body;

      const vehicle = await prisma.vehicle.update({
        where: { id },
        data: {
          model,
          plate,
          ...(capacity && { capacity: Number(capacity) }),
        },
      });

      return res.json(vehicle);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar veículo.' });
    }
  }

  async delete(req: any, res: any) {
    try {
      const { id } = req.params;

      await prisma.vehicle.delete({
        where: { id },
      });

      return res.status(204).send();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao deletar veículo. Pode estar em uso.' });
    }
  }
}
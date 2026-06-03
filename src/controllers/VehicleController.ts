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
      const { model, plate, capacity, status } = req.body;

      if (!model || !plate) {
        return res.status(400).json({ error: 'Campos obrigatórios: model, plate.' });
      }

      const vehicle = await prisma.vehicle.create({
        data: {
          model,
          plate,
          capacity: capacity ? Number(capacity) : 500.0,
          ...(status != null && { status }),
        },
      });

      return res.status(201).json(vehicle);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao cadastrar veículo.' });
    }
  }

  // ==========================================
  // EDITAR VEÍCULO
  // ==========================================
  async update(req: any, res: any) {
    try {
      const { id } = req.params;
      const { model, plate, capacity, status } = req.body;

      const vehicle = await prisma.vehicle.update({
        where: { id },
        data: {
          ...(model != null && { model }),
          ...(plate != null && { plate }),
          ...(capacity != null && { capacity: Number(capacity) }),
          ...(status != null && { status }),
        },
      });

      return res.json(vehicle);
    } catch (error) {
      console.error(error);
      return res.status(400).json({ error: 'Erro ao atualizar veículo.' });
    }
  }

  // ==========================================
  // EXCLUIR VEÍCULO
  // ==========================================
  async delete(req: any, res: any) {
    try {
      const { id } = req.params;

      await prisma.vehicle.delete({
        where: { id },
      });

      return res.status(204).send();
    } catch (error) {
      console.error(error);
      return res.status(400).json({ error: 'Não foi possível excluir o veículo. Ele pode estar vinculado a uma entrega.' });
    }
  } // <--- Fechamos a função delete aqui!

  // ==========================================
  // ATUALIZAR STATUS DO VEÍCULO (Fora da função delete)
  // ==========================================
  async updateStatus(req: any, res: any) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const vehicle = await prisma.vehicle.update({
        where: { id },
        data: { status },
      });

      return res.json(vehicle);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Veículo não encontrado.' });
      }
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar status do veículo.' });
    }
  }
}

import { Router } from 'express';
import { paramId } from '../../lib/params.js';
import { validate } from '../../middleware/validate.js';
import { listInstitutesQuerySchema } from './institutes.service.js';
import * as institutesService from './institutes.service.js';

export const institutesRouter = Router();

institutesRouter.get('/', validate(listInstitutesQuerySchema, 'query'), async (req, res, next) => {
  try {
    const result = await institutesService.listInstitutes(req.query as never);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

institutesRouter.get('/:id', async (req, res, next) => {
  try {
    const data = await institutesService.getInstituteById(paramId(req.params.id));
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

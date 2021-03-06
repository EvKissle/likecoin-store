import { Router } from 'express';

import users from './users';
import payment from './payment';
import iap from './iap';
import mission from './mission';
import oembed from './oembed';
import social from './social';
import { startPoller } from '../util/poller';
import { ValidationError } from '../../util/ValidationHelper';

const router = Router();

// Add USERS Routes
router.use(users);
router.use(payment);
router.use(iap);
router.use(mission);
router.use(oembed);
router.use(social);

router.get('/healthz', (req, res) => {
  res.sendStatus(200);
});

function errorHandler(err, req, res, next) {
  const msg = (err.response && err.response.data) || err.message || err;
  console.error(msg);
  if (res.headersSent) {
    return next(err);
  }
  if (err instanceof ValidationError) {
    return res.status(400).send(msg);
  }
  // Handle multer error
  if (err.code && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).send('FILE_TOO_LARGE');
  }
  return res.sendStatus(500);
}

router.use(errorHandler);

if (!process.env.CI) startPoller();
export default router;

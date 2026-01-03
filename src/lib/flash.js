export function setFlash(req, message, type = "info") {
  req.session.flash = { message, type };
}

export function consumeFlash(req) {
  const flash = req.session.flash;
  delete req.session.flash;
  return flash || null;
}

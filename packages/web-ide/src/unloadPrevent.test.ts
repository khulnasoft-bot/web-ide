import type { UnloadPreventer } from './unloadPreventer';
import { createUnloadPreventer } from './unloadPreventer';

describe('web-ide/src/unloadPreventer', () => {
  let preventer: UnloadPreventer;

  beforeEach(() => {
    preventer = createUnloadPreventer();
  });

  afterEach(() => {
    preventer.dispose();
  });

  const dispatchBeforeUnloadEvent = () => {
    const event = new Event('beforeunload');

    jest.spyOn(event, 'preventDefault');
    jest.spyOn(event, 'stopImmediatePropagation');

    window.dispatchEvent(event);

    return event;
  };

  describe('when should prevent unload event', () => {
    beforeEach(() => {
      preventer.setShouldPrevent(true);
    });

    it('stops unload default behavior', () => {
      const event = dispatchBeforeUnloadEvent();

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopImmediatePropagation).toHaveBeenCalled();
    });
  });

  describe('when should not prevent unload event', () => {
    beforeEach(() => {
      jest.spyOn(window, 'removeEventListener');
      preventer.setShouldPrevent(false);
    });

    it('stops unload default behavior', () => {
      const event = dispatchBeforeUnloadEvent();

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(event.stopImmediatePropagation).not.toHaveBeenCalled();
    });

    it('unregisters beforeunload event listener', () => {
      expect(window.removeEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    });
  });

  describe('when disposing', () => {
    beforeEach(() => {
      jest.spyOn(window, 'removeEventListener');
    });

    it('removes beforeunload event listener', () => {
      preventer.dispose();

      expect(window.removeEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    });
  });
});

import React, {useEffect,useState} from 'react';
import BenchTester from '../components/BenchTester'
import {hot} from 'react-hot-loader';
import Store from '../Objects/StoreRenderer';
import AcquisitionSettings from '../components/AcquisitionSettings';
const App = () => {
  const [userPreferences, setUserPreferences] = useState<Store|undefined>(undefined);
  const [editUserPreferences, setEditUserPreferences] = useState<boolean>(true);

  useEffect(() => {
    console.log('effect used');
    let store = new Store({configName:'user-preferences',defaults:{
      acquisitionSettings: {
        pulseCurrent: 550,
        pulseWidth: 5,
        pulsesSummed: 256,
        lifetimeStartingPoint: 3,
      },
      outputSettings: {
        threeVExpected: 3,
        threeVRange: 0.03,
        fiveVExpected: 5,
        fiveVRange: 0.25,
        envTempExpected: 23,
        envTempRange: 4,
        microprocessorTempExpected: 23,
        microprocessorTempRange: 7,
        ledTempExpected: 23,
        ledTempRange: 5,
        photodiodeCurrentExpected: 125,
        photodiodeCurrentRange: 11,
        darkCurrentExpected: 138,
        darkCurrentRange: 11,
        lifetimeExpected: 23.5,
        lifetimeRange: 2,
        pt0Expected: 1000,
        pt0Range: 200,
        pt3Expected: 800,
        pt3Range: 100
      }
    }
  });
  setUserPreferences(store);
  }, [])

  return (
    <div>
      {editUserPreferences && userPreferences && <AcquisitionSettings store={userPreferences}></AcquisitionSettings>}
      {!editUserPreferences && userPreferences && <BenchTester store={userPreferences}></BenchTester>}
      {editUserPreferences &&  userPreferences &&<button onClick={function() {setEditUserPreferences(false)}}>Home</button>}
      {!editUserPreferences && userPreferences && <button onClick={function() {setEditUserPreferences(true)}}>Settings</button>}
    </div>
  )
}
export default hot(module)(App);
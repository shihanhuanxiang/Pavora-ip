import { useState, useEffect } from 'react';
import { loadTaxonomyData, TaxonomyData } from '../services/taxonomyService';

export const useTaxonomy = () => {
  const [data, setData] = useState<TaxonomyData>({
    masterTaxonomy: [],
    apparelStructure: [],
    loadErrors: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Check if data is already cached globally or similar optimization could go here
    // For now, we load fresh
    loadTaxonomyData().then(result => {
      if (mounted) {
        setData(result);
        setLoading(false);
      }
    });

    return () => { mounted = false; };
  }, []);

  return { ...data, loading };
};
